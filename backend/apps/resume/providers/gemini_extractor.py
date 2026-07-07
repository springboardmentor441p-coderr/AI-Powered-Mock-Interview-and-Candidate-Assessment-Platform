"""
Gemini-backed resume extractor.

Activated when `AI_SERVICE_PROVIDER=gemini`. Mirrors
`OpenAIResumeExtractionProvider` (same port, same prompt contract, same
defensive JSON handling) so the two real providers are interchangeable
behind `IResumeExtractionProvider` and `ExtractionService` never needs to
know which one is wired up.

Uses Google's current unified SDK, `google-genai` (`pip install
google-genai`), NOT the deprecated `google-generativeai` package. The
model is asked for `application/json` output constrained by an explicit
`response_schema`, which avoids most of the "returned markdown fences /
extra commentary" failure modes you get from prompting alone.
"""
import json

from django.conf import settings

from apps.ai.providers.llm.interfaces import IResumeExtractionProvider, ResumeExtractionResult
from core.exceptions import ExternalServiceError

from apps.resume.services.text_extraction_service import ResumeTextExtractionService

_EXTRACTION_PROMPT = """You are a resume parser. Given the resume text below, extract:
- skills: soft/domain skills (e.g. "problem solving", "team leadership")
- technologies: concrete tools/languages/frameworks (e.g. "Python", "Docker")
- experience_years: total professional experience in years, best estimate
- education: each entry has a degree and optionally an institution
- summary: 2-3 sentences, third person, professional tone
- "experience": list of objects with "title", "company", "duration", "description"
- "projects": list of objects with "name", "description", "technologies" (list of strings)

Resume text:
---
{resume_text}
---
"""

_MAX_INPUT_CHARS = 12_000

# JSON Schema (subset understood by the Gemini API) describing the exact
# shape we need back - this is what makes the response reliably parseable
# JSON rather than free text that merely *tends* to look like JSON.
_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "skills": {"type": "ARRAY", "items": {"type": "STRING"}},
        "technologies": {"type": "ARRAY", "items": {"type": "STRING"}},
        "experience_years": {"type": "NUMBER"},
        "education": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "degree": {"type": "STRING"},
                    "institution": {"type": "STRING"},
                },
                "required": ["degree"],
            },
        },
        "summary": {"type": "STRING"},
        "experience": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "title": {"type": "STRING"},
                    "company": {"type": "STRING"},
                    "duration": {"type": "STRING"},
                    "description": {"type": "STRING"},
                },
                "required": ["title"],
            },
        },
        "projects": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "name": {"type": "STRING"},
                    "description": {"type": "STRING"},
                    "technologies": {"type": "ARRAY", "items": {"type": "STRING"}},
                },
                "required": ["name"],
            },
        },
    },
    "required": ["skills", "technologies", "experience_years", "education", "summary"],
}


class GeminiResumeExtractor(IResumeExtractionProvider):
    def __init__(self, text_extraction_service: ResumeTextExtractionService | None = None):
        self._text_extraction_service = text_extraction_service or ResumeTextExtractionService()

    def parse(self, file_path: str) -> ResumeExtractionResult:
        raw_text = self._text_extraction_service.extract_normalized_text(file_path)
        if not raw_text.strip():
            return ResumeExtractionResult(
                skills=[],
                technologies=[],
                experience_years=0.0,
                education=[],
                summary="No summary could be generated: the resume file contained no readable text.",
                raw_text=raw_text,
            )

        try:
            from google import genai
            from google.genai import types
        except ImportError as exc:
            raise ExternalServiceError(
                "The 'google-genai' package is not installed. Run `pip install google-genai`."
            ) from exc

        api_key = getattr(settings, "GEMINI_API_KEY", None)
        if not api_key:
            raise ExternalServiceError("GEMINI_API_KEY is not configured.")

        model = getattr(settings, "GEMINI_RESUME_MODEL", "gemini-2.5-flash")
        prompt = _EXTRACTION_PROMPT.format(resume_text=raw_text[:_MAX_INPUT_CHARS])

        client = genai.Client(api_key=api_key)
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=_RESPONSE_SCHEMA,
                    temperature=0.2,
                ),
            )
            content = response.text
            if not content:
                raise ExternalServiceError("Gemini returned an empty resume-extraction response.")
            payload = json.loads(content)
        except json.JSONDecodeError as exc:
            raise ExternalServiceError(
                "Gemini returned a response that was not valid JSON.", details={"reason": str(exc)}
            ) from exc
        except ExternalServiceError:
            raise
        except Exception as exc:  # noqa: BLE001
            raise ExternalServiceError("Resume parsing via Gemini failed.", details={"reason": str(exc)}) from exc
        finally:
            client.close()

        if not isinstance(payload, dict):
            raise ExternalServiceError("Gemini returned a JSON response that was not an object.")

        return ResumeExtractionResult(
            skills=payload.get("skills") or [],
            technologies=payload.get("technologies") or [],
            experience_years=float(payload.get("experience_years") or 0),
            education=payload.get("education") or [],
            summary=payload.get("summary") or "",
            raw_text=raw_text,
            experience=payload.get("experience") or [],
            projects=payload.get("projects") or [],
        )
