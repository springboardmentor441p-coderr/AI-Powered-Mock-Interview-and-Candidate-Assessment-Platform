import uuid

from apps.ai.providers.realtime_voice.interfaces import IRealtimeVoiceProvider, NormalizedEvent, RealtimeCallHandle


class MockRealtimeVoiceProvider(IRealtimeVoiceProvider):
    """
    Stands in for Ultravox when `AI_SERVICE_PROVIDER=mock` (the default).
    Lets the whole session lifecycle (create -> tool calls -> lifecycle
    events -> completion) be exercised end-to-end - including from an
    automated test or a `curl` script that simulates what Ultravox would
    send - without needing a real account.

    `join_url` points at nothing real; a mock frontend client can either
    skip the WebRTC join step entirely and just call the transcript
    endpoint directly to simulate turns, or a dev-mode fake caller can
    be built against this later.
    """

    def create_call(
        self,
        *,
        system_prompt: str,
        first_message: str,
        tools: list[dict],
        webhook_url: str,
        metadata: dict,
    ) -> RealtimeCallHandle:
        call_id = f"mock-call-{uuid.uuid4()}"
        return RealtimeCallHandle(
            call_id=call_id,
            join_url=f"mock://ultravox/join/{call_id}",
            provider="mock",
            raw={
                "systemPrompt": system_prompt,
                "firstMessage": first_message,
                "tools": [t.get("temporaryTool", t).get("modelToolName", t.get("toolName")) for t in tools],
                "webhookUrl": webhook_url,
                "metadata": metadata,
            },
        )

    def end_call(self, *, call_id: str) -> None:
        return None

    def parse_webhook_event(self, *, payload: dict, headers: dict | None = None) -> NormalizedEvent:
        # Accepts either the Ultravox account-webhook shape
        # ({"event": "call.ended", "call": {...}}) or a flat test shape
        # ({"type": "call_ended", ...}) so the same test payloads work
        # whether or not Ultravox is actually wired up.
        if "event" in payload:
            event_name = payload["event"]
            call = payload.get("call", {})
            return NormalizedEvent(
                type=event_name.replace(".", "_"),
                raw=payload,
                arguments={"call_id": call.get("callId")},
            )
        return NormalizedEvent(
            type=payload.get("type", "unknown"),
            role=payload.get("role"),
            text=payload.get("text", ""),
            start_ms=payload.get("start_ms"),
            end_ms=payload.get("end_ms"),
            tool_name=payload.get("tool_name"),
            tool_call_id=payload.get("tool_call_id"),
            arguments=payload.get("arguments", {}),
            raw=payload,
        )

    def build_tool_response(self, *, tool_call_id: str, result: str) -> dict:
        return {"result": result}
