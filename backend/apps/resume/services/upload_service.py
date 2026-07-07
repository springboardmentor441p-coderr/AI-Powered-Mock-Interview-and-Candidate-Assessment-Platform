from django.db import transaction

from core.services import BaseService

from apps.resume.models import Resume
from apps.resume.repositories.resume_repository import ResumeRepository


class UploadService(BaseService):
    """Single responsibility: accept an uploaded file and persist a Resume record."""

    def __init__(self, repo: ResumeRepository | None = None):
        super().__init__()
        self._repo = repo or ResumeRepository()

    @transaction.atomic
    def upload(self, *, candidate, file, make_primary: bool = True) -> Resume:
        resume = self._repo.create(
            candidate=candidate,
            file=file,
            original_filename=file.name,
            status=Resume.Status.UPLOADED,
        )
        if make_primary:
            self._repo.set_all_non_primary(candidate=candidate, exclude_id=resume.pk)
            self._repo.update(resume, is_primary=True)
        self.logger.info("Resume uploaded: %s by %s", resume.id, candidate.email)
        return resume
