"""
Ultravox adapter.

Reference: https://docs.ultravox.ai (Create Call, Webhooks, Custom Tools).
Ultravox's API is under active development - if call creation starts
returning 4xx errors, check the field names below against the current
"Create Call" reference before assuming the orchestrator logic is wrong.

Three distinct integration points, not one generic webhook:

1. Create Call (REST, server -> Ultravox): returns a `joinUrl` the
   browser uses with the Ultravox client SDK to join the call directly
   over WebRTC. Audio never touches our Django server.
2. Custom tool HTTP callbacks (Ultravox -> server, per tool): fired
   mid-call when the model invokes a tool we registered in
   `selectedTools` (e.g. `ask_next_question`). Handled separately by
   `InterviewOrchestrator`/the tool view, not through this class's
   `parse_webhook_event`. Authenticated via a static `X-Tool-Secret`
   header baked into the tool definition itself (see
   `InterviewOrchestrator._ask_next_question_tool`) - NOT through this
   class, since the secret is tool-specific, not provider-specific.
3. Account-level lifecycle webhooks (Ultravox -> server, one shared
   URL for the whole account): `call.started`, `call.joined`,
   `call.ended`, `call.billed`. Signed with an HMAC secret. This is
   what `parse_webhook_event` below decodes. Registering this webhook
   is a one-time account-setup step, not something that happens per
   call - see `ensure_account_webhook_registered` and the
   `setup_realtime_webhook` management command.
"""
import datetime
import hashlib
import hmac
import logging

import requests
from django.conf import settings

from core.exceptions import ExternalServiceError

from apps.ai.providers.realtime_voice.interfaces import IRealtimeVoiceProvider, NormalizedEvent, RealtimeCallHandle

logger = logging.getLogger(__name__)

_API_BASE = "https://api.ultravox.ai/api"
_REQUEST_TIMEOUT_SECONDS = 15
_WEBHOOK_MAX_CLOCK_SKEW = datetime.timedelta(minutes=1)


class UltravoxRealtimeVoiceProvider(IRealtimeVoiceProvider):
    def __init__(self):
        self._api_key = settings.ULTRAVOX_API_KEY
        self._model = getattr(settings, "ULTRAVOX_MODEL", "fixie-ai/ultravox")
        self._voice = getattr(settings, "ULTRAVOX_VOICE", "Mark")
        if not self._api_key:
            logger.warning(
                "UltravoxRealtimeVoiceProvider initialized without ULTRAVOX_API_KEY set; "
                "every call to the Ultravox API will fail."
            )
        self._session = requests.Session()
        self._session.headers.update({"Content-Type": "application/json", "X-API-Key": self._api_key})

    # ------------------------------------------------------------------
    # Internal HTTP helper
    # ------------------------------------------------------------------

    def _request(self, method: str, path: str, *, json: dict | None = None) -> requests.Response:
        url = f"{_API_BASE}{path}"
        try:
            response = self._session.request(method, url, json=json, timeout=_REQUEST_TIMEOUT_SECONDS)
        except requests.RequestException as exc:
            raise ExternalServiceError(
                f"Failed to reach Ultravox ({method} {path}).", details={"reason": str(exc)}
            ) from exc
        if response.status_code >= 400:
            try:
                body = response.json()
            except ValueError:
                body = response.text
            raise ExternalServiceError(
                f"Ultravox returned {response.status_code} for {method} {path}.",
                details={"status_code": response.status_code, "body": body},
            )
        return response

    # ------------------------------------------------------------------
    # Call lifecycle
    # ------------------------------------------------------------------

    def create_call(
        self,
        *,
        system_prompt: str,
        first_message: str,
        tools: list[dict],
        webhook_url: str,
        metadata: dict,
    ) -> RealtimeCallHandle:
        body = {
            "systemPrompt": system_prompt,
            "model": self._model,
            "voice": self._voice,
            "temperature": 0.4,
            "medium": {"webRtc": {}},
            "firstSpeakerSettings": {"agent": {"text": first_message}},
            "selectedTools": tools,
            "recordingEnabled": getattr(settings, "ULTRAVOX_RECORDING_ENABLED", False),
            "joinTimeout": "30s",
            # Same setting InterviewOrchestrator budgets its wrap-up pacing
            # against (see orchestrator_service._MAX_DURATION_SECONDS) - kept
            # as one shared value so the vendor's hard cutoff and our own
            # "start wrapping up" nudges never drift out of sync.
            "maxDuration": f"{getattr(settings, 'INTERVIEW_MAX_DURATION_SECONDS', 2700)}s",
            # Ultravox account-level webhooks are registered once (see
            # `ensure_account_webhook_registered`), not per call - `webhook_url`
            # is accepted here for interface symmetry with other providers but
            # intentionally unused in the request body.
            "metadata": metadata,
        }
        data = self._request("POST", "/calls", json=body).json()
        return RealtimeCallHandle(call_id=data["callId"], join_url=data["joinUrl"], provider="ultravox", raw=data)

    def end_call(self, *, call_id: str) -> None:
        # Ultravox's primary "end the call" mechanism is the built-in
        # `hangUp` tool invoked by the model itself (see
        # InterviewOrchestrator's tool list). This is a best-effort
        # server-initiated fallback for timeouts/abandonment; verify the
        # exact endpoint/verb against current docs before relying on it.
        try:
            self._session.delete(f"{_API_BASE}/calls/{call_id}", timeout=_REQUEST_TIMEOUT_SECONDS)
        except requests.RequestException as exc:
            logger.warning("Best-effort Ultravox end_call failed for %s: %s", call_id, exc)

    def parse_webhook_event(self, *, payload: dict, headers: dict | None = None) -> NormalizedEvent:
        event_name = payload.get("event", "unknown")
        call = payload.get("call", {})
        return NormalizedEvent(
            type=event_name.replace(".", "_"),
            raw=payload,
            arguments={"call_id": call.get("callId"), "end_reason": call.get("endReason")},
        )

    def build_tool_response(self, *, tool_call_id: str, result: str) -> dict:
        return {"result": result}

    # ------------------------------------------------------------------
    # Account-level webhook registration (one-time setup)
    # ------------------------------------------------------------------

    def ensure_account_webhook_registered(self, *, webhook_url: str, events: list[str]) -> None:
        """
        Idempotently create-or-update the account webhook that delivers
        call.started / call.joined / call.ended / call.billed to
        `webhook_url`. Safe to call repeatedly (e.g. on every deploy).

        Ultravox generates a webhook secret automatically unless one is
        supplied. If `ULTRAVOX_WEBHOOK_SECRET` isn't set, one is minted
        here and logged loudly - it must be copied into the environment
        so `parse_webhook_event`'s signature check (via
        `verify_webhook_signature`) actually works.
        """
        existing = self._request("GET", "/webhooks").json()
        match = next((w for w in existing.get("results", []) if w.get("url") == webhook_url), None)

        secret = settings.ULTRAVOX_WEBHOOK_SECRET
        body: dict = {"url": webhook_url, "events": events}
        if secret:
            body["secrets"] = [secret]

        if match:
            self._request("PATCH", f"/webhooks/{match['webhookId']}", json=body)
            logger.info("Updated existing Ultravox account webhook %s -> %s", match["webhookId"], webhook_url)
            return

        created = self._request("POST", "/webhooks", json=body).json()
        logger.info("Created Ultravox account webhook %s -> %s", created.get("webhookId"), webhook_url)
        if not secret:
            generated = created.get("secrets") or []
            logger.warning(
                "No ULTRAVOX_WEBHOOK_SECRET was configured, so Ultravox generated one: %s. "
                "Set ULTRAVOX_WEBHOOK_SECRET to this value or signature verification will "
                "silently no-op (see SessionRealtimeAccountWebhookView).",
                generated,
            )

    # ------------------------------------------------------------------
    # Webhook verification
    # ------------------------------------------------------------------

    @staticmethod
    def verify_webhook_signature(*, body: bytes, timestamp: str, signature_header: str, secret: str) -> bool:
        """
        Per https://docs.ultravox.ai/webhooks/securing-webhooks:
          1. Reject if the timestamp is more than a minute old (replay protection).
          2. Signature is HMAC-SHA256(secret, body + timestamp), hex-encoded.
        `signature_header` may contain multiple comma-separated signatures
        (key rotation) - any match is valid.
        """
        try:
            sent_at = datetime.datetime.fromisoformat(timestamp)
            now = datetime.datetime.now(sent_at.tzinfo) if sent_at.tzinfo else datetime.datetime.now()
            if abs(now - sent_at) > _WEBHOOK_MAX_CLOCK_SKEW:
                return False
        except (ValueError, TypeError):
            return False

        expected = hmac.new(secret.encode(), body + timestamp.encode(), hashlib.sha256).hexdigest()
        candidates = [s.strip() for s in signature_header.split(",") if s.strip()]
        return any(hmac.compare_digest(expected, candidate) for candidate in candidates)
