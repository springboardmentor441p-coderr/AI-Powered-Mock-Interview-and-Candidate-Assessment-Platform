"""
OpenAI-backed resume parser adapter.

Activated when `AI_SERVICE_PROVIDER=openai`. Kept import-light (the
`openai` package is only imported lazily) so the rest of the app does
not require the dependency to be installed in mock/test environments.
"""
import json

from django.conf import settings

from apps.ai.providers.llm.interfaces import IResumeExtractionProvider, ResumeExtractionResult
from core.exceptions import ExternalServiceError

from apps.resume.services.text_extraction_service import ResumeTextExtractionService

_EXTRACTION_PROMPT = """You are a resume parser. Given the resume text below, extract a JSON
object with EXACTLY these keys and nothing else:
- "skills": list[str] - soft/domain skills (e.g. "problem solving", "team leadership")
- "technologies": list[str] - concrete tools/languages/frameworks (e.g. "Python", "Docker")
- "experience_years": number - total professional experience in years, best estimate
- "education": list of objects with "degree" and optionally "institution"
- "summary": string, 2-3 sentences, third person, professional tone
- "experience": list of objects with "title", "company", "duration", "description"
- "projects": list of objects with "name", "description", "technologies" (list of strings)

Return ONLY valid JSON, no markdown fences, no commentary.

Resume text:
---
{resume_text}
---
"""

_MAX_INPUT_CHARS = 12_000


class OpenAIResumeExtractionProvider(IResumeExtractionProvider):
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
            from openai import OpenAI
        except ImportError as exc:
            raise ExternalServiceError("The 'openai' package is not installed.") from exc

        if not getattr(settings, "OPENAI_API_KEY", None):
            raise ExternalServiceError("OPENAI_API_KEY is not configured.")

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        model = getattr(settings, "OPENAI_RESUME_MODEL", "gpt-4o-mini")
        prompt = _EXTRACTION_PROMPT.format(resume_text=raw_text[:_MAX_INPUT_CHARS])

        try:
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content
            if not content:
                raise ExternalServiceError("OpenAI returned an empty resume-extraction response.")
            payload = json.loads(content)
        except json.JSONDecodeError as exc:
            raise ExternalServiceError(
                "OpenAI returned a response that was not valid JSON.", details={"reason": str(exc)}
            ) from exc
        except ExternalServiceError:
            raise
        except Exception as exc:  # noqa: BLE001
            raise ExternalServiceError("Resume parsing via OpenAI failed.", details={"reason": str(exc)}) from exc

        if not isinstance(payload, dict):
            raise ExternalServiceError("OpenAI returned a JSON response that was not an object.")

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
