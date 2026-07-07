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
   `parse_webhook_event`.
3. Account-level lifecycle webhooks (Ultravox -> server, one shared
   URL for the whole account): `call.started`, `call.joined`,
   `call.ended`, `call.billed`. Signed with an HMAC secret. This is
   what `parse_webhook_event` below decodes.
"""
import hashlib
import hmac

from django.conf import settings

from core.exceptions import ExternalServiceError

from apps.ai.providers.realtime_voice.interfaces import IRealtimeVoiceProvider, NormalizedEvent, RealtimeCallHandle

_API_BASE = "https://api.ultravox.ai/api"


class UltravoxRealtimeVoiceProvider(IRealtimeVoiceProvider):
    def __init__(self):
        self._api_key = settings.ULTRAVOX_API_KEY
        self._model = getattr(settings, "ULTRAVOX_MODEL", "fixie-ai/ultravox")
        self._voice = getattr(settings, "ULTRAVOX_VOICE", "Mark")

    def _headers(self) -> dict:
        return {"Content-Type": "application/json", "X-API-Key": self._api_key}

    def create_call(
        self,
        *,
        system_prompt: str,
        first_message: str,
        tools: list[dict],
        webhook_url: str,
        metadata: dict,
    ) -> RealtimeCallHandle:
        import requests

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
            "maxDuration": f"{getattr(settings, 'ULTRAVOX_MAX_CALL_SECONDS', 2700)}s",
            "metadata": metadata,
        }
        try:
            response = requests.post(f"{_API_BASE}/calls", headers=self._headers(), json=body, timeout=15)
            response.raise_for_status()
        except requests.RequestException as exc:
            raise ExternalServiceError("Failed to create Ultravox call.", details={"reason": str(exc)}) from exc

        data = response.json()
        return RealtimeCallHandle(call_id=data["callId"], join_url=data["joinUrl"], provider="ultravox", raw=data)

    def end_call(self, *, call_id: str) -> None:
        import requests

        # Ultravox's primary "end the call" mechanism is the built-in
        # `hangUp` tool invoked by the model itself (see
        # InterviewOrchestrator's tool list). This is a best-effort
        # server-initiated fallback for timeouts/abandonment; verify the
        # exact endpoint/verb against current docs before relying on it.
        try:
            requests.delete(f"{_API_BASE}/calls/{call_id}", headers=self._headers(), timeout=10)
        except requests.RequestException:
            pass

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

    @staticmethod
    def verify_webhook_signature(*, body: bytes, timestamp: str, signature_header: str, secret: str) -> bool:
        """
        Per https://docs.ultravox.ai/guides/webhooks: signature is
        HMAC-SHA256(secret, body + timestamp), hex-encoded.
        `signature_header` may contain multiple comma-separated
        signatures (key rotation) - any match is valid.
        """
        expected = hmac.new(secret.encode(), body + timestamp.encode(), hashlib.sha256).hexdigest()
        candidates = [s.strip() for s in signature_header.split(",") if s.strip()]
        return any(hmac.compare_digest(expected, candidate) for candidate in candidates)
