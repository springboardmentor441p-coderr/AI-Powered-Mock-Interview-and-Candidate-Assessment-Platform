"""
Service layer responsible for all communication with the Ollama LLM.
"""

import json
import logging

from ollama import Client
from ollama import ResponseError

from app.config import settings

logger = logging.getLogger(__name__)


class OllamaConnectionError(Exception):
    """Raised when the Ollama server cannot be reached or errors out."""


class OllamaInvalidResponseError(Exception):
    """Raised when Ollama returns a response that is not valid JSON."""


# Single shared client, configured from environment variables.
_client = Client(host=settings.OLLAMA_HOST)


RESUME_EXTRACTION_SYSTEM_PROMPT = """You are a resume parsing engine. You will be given the raw text of a resume.

Extract the information into the EXACT JSON structure shown below. Follow these rules strictly:
- Return ONLY valid JSON. Do not return markdown, code fences, or any explanation.
- Do not add any keys that are not in the structure below.
- If a field's value is missing from the resume, use null for strings/objects and [] for arrays.
- "skills", "certifications", and "languages" must be arrays of strings.
- "education", "experience", and "projects" must be arrays of objects, even if there is only one entry.
- Dates/durations should be copied as plain text as they appear in the resume.

JSON structure to fill:
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


def build_resume_prompt(resume_text: str) -> list[dict[str, str]]:
    """
    Build the chat messages sent to Ollama for resume extraction.

    Args:
        resume_text: The raw text extracted from the uploaded resume file.

    Returns:
        A list of chat messages in the format expected by the Ollama
        Python client's `chat` method.
    """
    return [
        {"role": "system", "content": RESUME_EXTRACTION_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"Resume text:\n\"\"\"\n{resume_text}\n\"\"\"\n\n"
            "Return only the JSON object described in the system prompt.",
        },
    ]


def query_ollama_for_resume_json(resume_text: str) -> str:
    """
    Send resume text to Ollama and return the raw (string) LLM response.

    Args:
        resume_text: The raw text extracted from the uploaded resume file.

    Returns:
        The raw text content returned by the model. This is expected to
        be a JSON string, but is NOT parsed here - parsing/validation is
        the caller's responsibility.

    Raises:
        OllamaConnectionError: If the Ollama server cannot be reached or
            returns an error.
    """
    messages = build_resume_prompt(resume_text)

    try:
        response = _client.chat(
            model=settings.OLLAMA_MODEL,
            messages=messages,
            format="json",  # Ask Ollama to constrain output to valid JSON
            options={"temperature": 0},
        )
    except ResponseError as exc:
        logger.exception("Ollama returned an error response")
        raise OllamaConnectionError(f"Ollama returned an error: {exc}") from exc
    except Exception as exc:  # noqa: BLE001 - e.g. connection refused
        logger.exception("Failed to connect to Ollama at %s", settings.OLLAMA_HOST)
        raise OllamaConnectionError(
            f"Could not reach Ollama server at {settings.OLLAMA_HOST}: {exc}"
        ) from exc

    raw_content = response.get("message", {}).get("content", "")

    # Always log the raw response for debugging, per requirement #5.
    logger.debug("Raw Ollama response: %s", raw_content)

    if not raw_content or not raw_content.strip():
        raise OllamaConnectionError("Ollama returned an empty response.")

    return raw_content


def parse_llm_json_response(raw_content: str) -> dict:
    """
    Parse the raw text returned by Ollama into a Python dict.

    Handles the common case where a model wraps JSON in markdown code
    fences despite instructions not to, by stripping them before parsing.

    Args:
        raw_content: The raw string content returned by the LLM.

    Returns:
        The parsed JSON object as a dict.

    Raises:
        OllamaInvalidResponseError: If the content is not valid JSON.
    """
    cleaned = raw_content.strip()

    # Defensive cleanup in case the model ignores the "no markdown" instruction.
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse JSON from Ollama response: %s", raw_content)
        raise OllamaInvalidResponseError(
            f"Ollama did not return valid JSON: {exc}"
        ) from exc
