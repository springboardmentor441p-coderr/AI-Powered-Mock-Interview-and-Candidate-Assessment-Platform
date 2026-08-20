"""Async, provider-neutral boundary for future LLM integrations."""

from __future__ import annotations

import asyncio
import json
import logging
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from dataclasses import dataclass, field
from typing import Any, Protocol

logger = logging.getLogger(__name__)


class LLMError(RuntimeError):
    """Base error for LLM transport and configuration failures."""


class LLMNotConfiguredError(LLMError):
    """Raised when an LLM is requested before an adapter is configured."""


@dataclass(frozen=True, slots=True)
class LLMProviderSettings:
    provider: str
    model: str | None
    api_key: str | None
    timeout_seconds: float
    base_url: str | None = None

    @classmethod
    def from_environment(cls) -> "LLMProviderSettings":
        provider = os.getenv("LLM_PROVIDER", "disabled").strip().lower()
        key_environment = {
            "openai": "OPENAI_API_KEY",
            "gemini": "GEMINI_API_KEY",
            "claude": "ANTHROPIC_API_KEY",
            "ollama": None,
        }
        api_key = os.getenv("LLM_API_KEY")
        if not api_key and key_environment.get(provider):
            api_key = os.getenv(key_environment[provider] or "")
        try:
            timeout_seconds = float(os.getenv("LLM_TIMEOUT_SECONDS", "30"))
        except ValueError:
            timeout_seconds = 30.0
        return cls(
            provider=provider,
            model=os.getenv("LLM_MODEL") or None,
            api_key=api_key or None,
            timeout_seconds=max(timeout_seconds, 1.0),
            base_url=os.getenv("OLLAMA_BASE_URL") if provider == "ollama" else None,
        )


@dataclass(frozen=True, slots=True)
class LLMRequest:
    prompt: str
    temperature: float = 0.2
    max_tokens: int | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    response_schema: dict[str, Any] | None = None


@dataclass(frozen=True, slots=True)
class LLMResponse:
    content: str
    provider: str
    model: str | None = None
    raw: Any | None = None


class LLMProvider(Protocol):
    """Adapter contract; concrete SDK/HTTP integrations belong outside the agent."""

    async def complete(self, request: LLMRequest, settings: LLMProviderSettings) -> LLMResponse: ...


class GeminiProvider:
    """Small REST adapter kept separate from interview policy and routing."""

    async def complete(self, request: LLMRequest, settings: LLMProviderSettings) -> LLMResponse:
        if not settings.api_key:
            raise LLMNotConfiguredError("GEMINI_API_KEY is required when LLM_PROVIDER=gemini.")
        if not settings.model:
            raise LLMNotConfiguredError("LLM_MODEL is required when LLM_PROVIDER=gemini.")
        return await asyncio.to_thread(self._complete_sync, request, settings)

    @staticmethod
    def _complete_sync(request: LLMRequest, settings: LLMProviderSettings) -> LLMResponse:
        body: dict[str, Any] = {
            "contents": [{"parts": [{"text": request.prompt}]}],
            "generationConfig": {"temperature": request.temperature},
        }
        if request.max_tokens:
            body["generationConfig"]["maxOutputTokens"] = request.max_tokens
        if request.response_schema:
            body["generationConfig"].update({
                "responseMimeType": "application/json",
                "responseSchema": request.response_schema,
            })
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.model}:generateContent"
        http_request = Request(
            endpoint,
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json", "x-goog-api-key": settings.api_key or ""},
            method="POST",
        )
        try:
            with urlopen(http_request, timeout=settings.timeout_seconds) as response:  # nosec B310: fixed Google endpoint
                raw = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:500]
            raise LLMError(f"Gemini request failed with HTTP {exc.code}: {detail}") from exc
        except URLError as exc:
            raise LLMError("Gemini service is unavailable.") from exc
        try:
            content = raw["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (KeyError, IndexError, TypeError, AttributeError) as exc:
            raise LLMError("Gemini returned no usable response content.") from exc
        return LLMResponse(content=content, provider="gemini", model=settings.model, raw=raw)


class LLMService:
    """Dispatches requests through an injected provider adapter with a timeout."""

    def __init__(
        self,
        provider: LLMProvider | None = None,
        *,
        settings: LLMProviderSettings | None = None,
    ) -> None:
        self.settings = settings or LLMProviderSettings.from_environment()
        self.provider = provider or self._provider_for(self.settings)

    @staticmethod
    def _provider_for(settings: LLMProviderSettings) -> LLMProvider | None:
        if settings.provider == "gemini":
            return GeminiProvider()
        return None

    async def generate(self, request: LLMRequest) -> LLMResponse:
        if self.settings.provider in {"", "disabled", "none"}:
            raise LLMNotConfiguredError("LLM_PROVIDER is disabled; no interview LLM has been enabled.")
        if self.provider is None:
            raise LLMNotConfiguredError(
                f"No adapter is registered for LLM provider '{self.settings.provider}'."
            )
        logger.info("Sending LLM request", extra={"provider": self.settings.provider, "model": self.settings.model})
        try:
            return await asyncio.wait_for(
                self.provider.complete(request, self.settings),
                timeout=self.settings.timeout_seconds,
            )
        except TimeoutError as exc:
            logger.warning("LLM request timed out", extra={"provider": self.settings.provider})
            raise LLMError("LLM request timed out.") from exc
        except LLMError:
            raise
        except Exception as exc:
            logger.exception("LLM provider request failed", extra={"provider": self.settings.provider})
            raise LLMError("LLM provider request failed.") from exc
