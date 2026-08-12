"""
Groq LLM service for Verixa.

All backend LLM calls use Groq's OpenAI-compatible Chat Completions API.
"""

from __future__ import annotations

import json
import logging
import time
from threading import Lock
from typing import Any
from urllib.parse import urljoin

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_client: httpx.Client | None = None
_client_lock = Lock()


def get_groq_client() -> httpx.Client:
    """Return one thread-safe pooled client for the lifetime of the process."""
    global _client
    if _client is None:
        with _client_lock:
            if _client is None:
                _client = httpx.Client(timeout=_groq_timeout())
    return _client


def close_groq_client() -> None:
    """Close the pooled Groq transport during application shutdown."""
    global _client
    with _client_lock:
        if _client is not None:
            _client.close()
            _client = None


class GroqConnectionError(Exception):
    """Raised when Groq cannot be reached or returns an API error."""


class GroqInvalidResponseError(Exception):
    """Raised when Groq returns malformed data or invalid JSON content."""


class GroqTimeoutError(GroqConnectionError):
    """Raised when Groq exceeds the configured timeout."""


class GroqConfigurationError(GroqConnectionError):
    """Raised when Groq credentials are missing."""


RESUME_EXTRACTION_SYSTEM_PROMPT = """
You extract structured resume data.
Return ONLY valid JSON. No markdown. Missing strings must be null.
Missing arrays must be [].

Required keys:
name, email, phone, linkedin, github, portfolio, location, summary,
skills, education, experience, projects, certifications, languages.

education items: institution, degree, field, cgpa, year.
experience items: company, role, duration, description.
project items: title, technologies, description.
"""


def _groq_timeout() -> httpx.Timeout:
    """Build an httpx timeout object for Groq API calls."""
    return httpx.Timeout(
        timeout=float(settings.GROQ_TIMEOUT_SECONDS),
        connect=float(settings.GROQ_CONNECT_TIMEOUT_SECONDS),
        read=float(settings.GROQ_TIMEOUT_SECONDS),
        write=30.0,
        pool=float(settings.GROQ_CONNECT_TIMEOUT_SECONDS),
    )


def _groq_api_url(path: str) -> str:
    """Return an absolute Groq API URL for the configured base URL."""
    base = settings.GROQ_BASE_URL.rstrip("/") + "/"
    return urljoin(base, path.lstrip("/"))


def _extract_groq_content(response_data: dict[str, Any]) -> str:
    """Extract assistant content from Groq's OpenAI-compatible response."""
    choices = response_data.get("choices")
    if not isinstance(choices, list) or not choices:
        raise GroqInvalidResponseError("Groq response did not contain choices.")

    first_choice = choices[0]
    message = first_choice.get("message") if isinstance(first_choice, dict) else None
    if not isinstance(message, dict):
        raise GroqInvalidResponseError("Groq response did not contain message.")

    content = message.get("content", "")
    return content if isinstance(content, str) else str(content or "")


def _post_groq_chat(payload: dict[str, Any]) -> dict[str, Any]:
    """POST to Groq chat completions with explicit timeout and diagnostics."""
    if not settings.GROQ_API_KEY:
        raise GroqConfigurationError(
            "GROQ_API_KEY is missing. Add it to backend/.env and restart FastAPI."
        )

    url = _groq_api_url("/chat/completions")
    timeout = _groq_timeout()
    started = time.perf_counter()
    model = payload.get("model")
    message_count = len(payload.get("messages") or [])
    json_mode = bool(payload.get("response_format"))

    logger.info(
        "Groq chat request starting: url=%s model=%s messages=%d json_mode=%s "
        "timeouts(connect=%ss read=%ss)",
        url,
        model,
        message_count,
        json_mode,
        timeout.connect,
        timeout.read,
    )

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        response = get_groq_client().post(url, json=payload, headers=headers)
        elapsed = time.perf_counter() - started
        logger.info(
            "Groq chat HTTP response received: status=%s elapsed=%.2fs",
            response.status_code,
            elapsed,
        )
        response.raise_for_status()
        data = response.json()

    except httpx.TimeoutException as exc:
        elapsed = time.perf_counter() - started
        logger.exception("Groq chat timed out after %.2fs.", elapsed)
        raise GroqTimeoutError(f"Groq request timed out after {elapsed:.2f}s.") from exc

    except httpx.HTTPStatusError as exc:
        elapsed = time.perf_counter() - started
        body = exc.response.text[:1000]
        logger.exception(
            "Groq returned HTTP %s after %.2fs. Body: %s",
            exc.response.status_code,
            elapsed,
            body,
        )
        raise GroqConnectionError(
            f"Groq returned HTTP {exc.response.status_code}: {body}"
        ) from exc

    except json.JSONDecodeError as exc:
        elapsed = time.perf_counter() - started
        logger.exception("Groq returned non-JSON HTTP response after %.2fs.", elapsed)
        raise GroqInvalidResponseError(
            "Groq returned a response that was not valid JSON."
        ) from exc

    except httpx.HTTPError as exc:
        elapsed = time.perf_counter() - started
        logger.exception("Groq HTTP error after %.2fs.", elapsed)
        raise GroqConnectionError(f"Groq HTTP request failed: {exc}") from exc

    elapsed = time.perf_counter() - started
    usage = data.get("usage") if isinstance(data, dict) else None
    logger.info("Groq chat request completed: elapsed=%.2fs usage=%s", elapsed, usage)
    return data


def chat_with_groq(
    messages: list[dict[str, str]],
    *,
    model: str | None = None,
    temperature: float = 0.2,
    json_output: bool = False,
    max_tokens: int | None = None,
) -> str:
    """
    Run a Groq chat completion and return raw assistant text.
    """
    selected_model = model or settings.GROQ_MODEL
    payload: dict[str, Any] = {
        "model": selected_model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens or settings.GROQ_MAX_TOKENS,
    }

    if json_output:
        payload["response_format"] = {"type": "json_object"}

    prompt_chars = sum(len(message.get("content", "")) for message in messages)
    logger.info(
        "Preparing Groq chat: model=%s prompt_chars=%d temperature=%s json_output=%s",
        selected_model,
        prompt_chars,
        temperature,
        json_output,
    )

    response_data = _post_groq_chat(payload)
    content = _extract_groq_content(response_data)
    logger.info("Groq response extracted: content_chars=%d", len(content))
    logger.debug("Groq response content:\n%s", content)

    if not content.strip():
        raise GroqConnectionError("Empty response received from Groq.")

    return content


def build_resume_prompt(resume_text: str) -> list[dict[str, str]]:
    """Build prompt for resume extraction."""
    return [
        {
            "role": "system",
            "content": RESUME_EXTRACTION_SYSTEM_PROMPT,
        },
        {
            "role": "user",
            "content": (
                f'Resume Text:\n"""\n{resume_text}\n"""\n\n'
                "Extract the resume into the required JSON object."
            ),
        },
    ]


def query_groq_for_resume_json(resume_text: str) -> str:
    """Query Groq for structured resume JSON."""
    return chat_with_groq(
        messages=build_resume_prompt(resume_text),
        temperature=0,
        json_output=True,
    )


def parse_llm_json_response(raw_content: str) -> dict:
    """
    Parse JSON returned by the LLM.

    Removes markdown code fences if the model accidentally returns them.
    """
    cleaned = raw_content.strip()

    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")

        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]

        cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)

    except json.JSONDecodeError as exc:
        logger.exception("Invalid JSON returned by Groq. Raw content: %s", raw_content)
        raise GroqInvalidResponseError("Groq did not return valid JSON.") from exc
