from core.services import BaseService

from apps.resume.models import Resume
from apps.resume.repositories.resume_repository import ResumeRepository
from apps.resume.validators.extraction_result_validator import ResumeExtractionValidator


class SummaryService(BaseService):
    """
    Derives or refines the resume summary. Kept as a separate service
    so a more advanced summary model (e.g. a dedicated summarisation
    LLM call) can be plugged in without touching ExtractionService.
    """

    def __init__(self, repo: ResumeRepository | None = None):
        super().__init__()
        self._repo = repo or ResumeRepository()

    def generate(self, *, resume: Resume) -> str:
        if resume.summary:
            return resume.summary

        raw = resume.raw_text or ""
        max_len = ResumeExtractionValidator.MAX_SUMMARY_LENGTH
        summary = (raw[:max_len] + "...") if len(raw) > max_len else raw or "No summary available."
        self._repo.update(resume, summary=summary)
        return summary
