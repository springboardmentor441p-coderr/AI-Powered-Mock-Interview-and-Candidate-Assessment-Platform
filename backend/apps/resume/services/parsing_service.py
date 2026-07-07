"""
Parsing service: extracts raw, normalised text from the uploaded resume file.

Keeps file-reading concerns separate from skill extraction so each can
evolve (or be replaced) independently. All actual file-reading logic
lives in `ResumeTextExtractionService` (single source of truth, reused
by every extraction provider too) - this service is just the orchestrator
that ties it to the `Resume` record.
"""
from core.services import BaseService

from apps.resume.models import Resume
from apps.resume.repositories.resume_repository import ResumeRepository
from apps.resume.services.text_extraction_service import ResumeTextExtractionService


class ParsingService(BaseService):
    """Reads and normalises raw text from the resume file; updates `raw_text` on the Resume."""

    def __init__(
        self,
        repo: ResumeRepository | None = None,
        text_extractor: ResumeTextExtractionService | None = None,
    ):
        super().__init__()
        self._repo = repo or ResumeRepository()
        self._text_extractor = text_extractor or ResumeTextExtractionService()

    def parse(self, *, resume: Resume) -> str:
        raw_text = self._text_extractor.extract_normalized_text(resume.file.path)

        if not raw_text:
            self.logger.warning("No text could be extracted from resume %s", resume.id)

        self._repo.update(resume, raw_text=raw_text)
        return raw_text
