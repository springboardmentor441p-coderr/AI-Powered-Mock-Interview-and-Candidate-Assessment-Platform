"""
Realtime voice AI port.

This is the piece that turns the interview from "generate questions,
save them, wait for the candidate to submit text/audio per question"
into an actual live, interruptible voice conversation. A provider
implementation is responsible for:

  1. Starting a call (given a system prompt + tool definitions + a
     webhook URL) and handing back a URL/token the browser can use to
     join the call directly (WebRTC) - audio never has to pass through
     our Django server.
  2. Normalizing that provider's webhook payloads into a small common
     event vocabulary so `InterviewOrchestrator` doesn't need to know
     which vendor is behind it: transcript, tool_call, interruption,
     call_started, call_ended.

Swapping Ultravox for another realtime voice vendor later means
writing one new adapter here - nothing in `InterviewOrchestrator` or
the views should need to change.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class RealtimeCallHandle:
    call_id: str
    join_url: str
    provider: str = "ultravox"
    raw: dict[str, Any] = field(default_factory=dict)


@dataclass
class NormalizedEvent:
    """
    Common shape every provider's webhook payload gets translated into.

    type is one of: "call_started", "transcript", "interruption",
    "tool_call", "call_ended".
    """

    type: str
    role: str | None = None            # "assistant" | "user", for transcript events
    text: str = ""                     # transcript text, for transcript events
    start_ms: int | None = None
    end_ms: int | None = None
    tool_name: str | None = None       # for tool_call events
    tool_call_id: str | None = None
    arguments: dict[str, Any] = field(default_factory=dict)
    raw: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return {
            "type": self.type,
            "role": self.role,
            "text": self.text,
            "start_ms": self.start_ms,
            "end_ms": self.end_ms,
            "tool_name": self.tool_name,
            "tool_call_id": self.tool_call_id,
            "arguments": self.arguments,
            "raw": self.raw,
        }


class IRealtimeVoiceProvider(ABC):
    @abstractmethod
    def create_call(
        self,
        *,
        system_prompt: str,
        first_message: str,
        tools: list[dict],
        webhook_url: str,
        metadata: dict,
    ) -> RealtimeCallHandle:
        """Start a realtime voice call and return how the client should join it."""
        ...

    @abstractmethod
    def end_call(self, *, call_id: str) -> None:
        """Force-terminate an in-progress call (e.g. on session timeout/abandon)."""
        ...

    @abstractmethod
    def parse_webhook_event(self, *, payload: dict, headers: dict | None = None) -> NormalizedEvent:
        """Translate a provider-specific webhook payload into a NormalizedEvent."""
        ...

    @abstractmethod
    def build_tool_response(self, *, tool_call_id: str, result: str) -> dict:
        """Build the payload this provider expects as the HTTP response to a tool_call webhook."""
        ...

    def ensure_account_webhook_registered(self, *, webhook_url: str, events: list[str]) -> None:
        """
        Idempotently register/update this provider's account-level lifecycle
        webhook (one-time setup, not part of the per-call flow - see
        `apps/interview/management/commands/setup_realtime_webhook.py`).

        Not every provider has this concept (e.g. `Mock`, or a future vendor
        that only supports per-call callbacks), so this is a concrete no-op
        rather than an abstract method - overriding it is opt-in.
        """
        return None
