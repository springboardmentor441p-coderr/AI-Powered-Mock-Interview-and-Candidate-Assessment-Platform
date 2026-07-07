"""
Mock resume parser.

Used when `AI_SERVICE_PROVIDER=mock` (the default for local dev/tests)
so the entire upload -> parse -> persist pipeline works without any
external API keys. Produces deterministic, plausible-looking output
derived from the same normalised text every real provider works from.
"""
import re

from apps.ai.providers.llm.interfaces import IResumeExtractionProvider, ResumeExtractionResult
from apps.resume.services.text_extraction_service import ResumeTextExtractionService

_COMMON_SKILLS = [
    "python", "java", "javascript", "typescript", "react", "django", "fastapi",
    "node.js", "sql", "postgresql", "mongodb", "docker", "kubernetes", "aws",
    "azure", "git", "rest api", "graphql", "machine learning", "tensorflow",
    "pytorch", "data structures", "algorithms", "html", "css",
]

_EDUCATION_KEYWORDS = ("b.tech", "bachelor", "m.tech", "master", "phd", "b.sc", "m.sc")


class MockResumeExtractor(IResumeExtractionProvider):
    """
    Deterministic, keyword-based stand-in for a real LLM extraction call.
    Depends only on the `ResumeTextExtractionService` abstraction (DI) so
    the file-reading strategy can be swapped/faked in tests without
    changing this class.
    """

    def __init__(self, text_extraction_service: ResumeTextExtractionService | None = None):
        self._text_extraction_service = text_extraction_service or ResumeTextExtractionService()

    def parse(self, file_path: str) -> ResumeExtractionResult:
        raw_text = self._text_extraction_service.extract_normalized_text(file_path)
        text_lower = raw_text.lower()

        skills_found = sorted({skill for skill in _COMMON_SKILLS if skill in text_lower})
        technologies = [s for s in skills_found if s not in ("data structures", "algorithms")]

        years_match = re.search(r"(\d+(?:\.\d+)?)\s*\+?\s*years?", text_lower)
        experience_years = float(years_match.group(1)) if years_match else 0.0

        education = [
            {"degree": keyword.title(), "raw_match": keyword}
            for keyword in _EDUCATION_KEYWORDS
            if keyword in text_lower
        ]

        summary = (raw_text[:280] + "...") if len(raw_text) > 280 else raw_text or "No summary could be generated."

        return ResumeExtractionResult(
            skills=skills_found or ["communication", "problem solving"],
            technologies=technologies,
            experience_years=experience_years,
            education=education,
            summary=summary,
            raw_text=raw_text,
        )
