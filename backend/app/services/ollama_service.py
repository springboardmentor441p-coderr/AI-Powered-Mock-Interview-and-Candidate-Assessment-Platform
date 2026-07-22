"""
Service layer responsible for all communication with the Ollama LLM.
"""

import json
import logging
from typing import Any

from ollama import Client
from ollama import ResponseError

from app.config import settings

logger = logging.getLogger(__name__)


class OllamaConnectionError(Exception):
    """Raised when the Ollama server cannot be reached or errors out."""


class OllamaInvalidResponseError(Exception):
    """Raised when Ollama returns invalid JSON."""


# Shared Ollama client
_client = Client(host=settings.OLLAMA_HOST)


# ======================================================================
# Resume Parser System Prompt
# ======================================================================

RESUME_EXTRACTION_SYSTEM_PROMPT = """
You are a resume parsing engine.

You will be given the raw text of a resume.

Extract the information into the EXACT JSON structure shown below.

Rules:

- Return ONLY valid JSON.
- Do NOT return markdown.
- Do NOT explain anything.
- Missing string values -> null
- Missing arrays -> []

JSON structure:

{
  "name": "",
  "email": "",
  "phone": "",
  "linkedin": "",
  "github": "",
  "portfolio": "",
  "location": "",
  "summary": "",
  "skills": [],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": "",
      "cgpa": "",
      "year": ""
    }
  ],
  "experience": [
    {
      "company": "",
      "role": "",
      "duration": "",
      "description": ""
    }
  ],
  "projects": [
    {
      "title": "",
      "technologies": [],
      "description": ""
    }
  ],
  "certifications": [],
  "languages": []
}
"""


# ======================================================================
# Generic Ollama Chat
# ======================================================================

def chat_with_ollama(
    messages: list[dict[str, str]],
    *,
    model: str | None = None,
    temperature: float = 0.2,
    json_output: bool = False,
) -> str:
    """
    Generic Ollama chat function.

    Args:
        messages: Chat messages.
        model: Optional model override.
        temperature: Sampling temperature.
        json_output: If True, asks Ollama to return JSON.

    Returns:
        Raw model response.
    """

    try:
        kwargs: dict[str, Any] = {
            "model": model or settings.OLLAMA_MODEL,
            "messages": messages,
            "options": {
                "temperature": temperature
            },
        }

        if json_output:
            kwargs["format"] = "json"

        response = _client.chat(**kwargs)

    except ResponseError as exc:
        logger.exception("Ollama returned an error.")
        raise OllamaConnectionError(str(exc)) from exc

    except Exception as exc:
        logger.exception("Unable to connect to Ollama.")
        raise OllamaConnectionError(
            f"Unable to connect to Ollama server ({settings.OLLAMA_HOST})"
        ) from exc

    content = response.get("message", {}).get("content", "")

    logger.debug("Ollama Response:\n%s", content)

    if not content.strip():
        raise OllamaConnectionError("Empty response received from Ollama.")

    return content


# ======================================================================
# Resume Prompt Builder
# ======================================================================

def build_resume_prompt(resume_text: str) -> list[dict[str, str]]:
    """
    Build prompt for resume extraction.
    """

    return [
        {
            "role": "system",
            "content": RESUME_EXTRACTION_SYSTEM_PROMPT,
        },
        {
            "role": "user",
            "content": (
                f'Resume Text:\n"""\n{resume_text}\n"""\n\n'
                "Return ONLY the JSON."
            ),
        },
    ]


# ======================================================================
# Resume Extraction
# ======================================================================

def query_ollama_for_resume_json(resume_text: str) -> str:
    """
    Query Ollama for structured resume JSON.
    """

    messages = build_resume_prompt(resume_text)

    return chat_with_ollama(
        messages=messages,
        temperature=0,
        json_output=True,
    )


# ======================================================================
# JSON Parsing Utility
# ======================================================================

def parse_llm_json_response(raw_content: str) -> dict:
    """
    Parse JSON returned by Ollama.

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
        logger.exception("Invalid JSON returned by Ollama.")
        raise OllamaInvalidResponseError(
            "Ollama did not return valid JSON."
        ) from exc
