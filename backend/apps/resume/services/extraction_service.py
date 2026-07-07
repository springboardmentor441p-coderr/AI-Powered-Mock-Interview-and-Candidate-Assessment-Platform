from django.db import transaction

from apps.ai.providers.llm.interfaces import IResumeExtractionProvider
from core.services import BaseService

from apps.resume.models import Resume
from apps.resume.repositories.resume_repository import ExtractedSkillRepository, ResumeRepository
from apps.resume.validators.extraction_result_validator import ResumeExtractionValidator


class ExtractionService(BaseService):
    """
    Calls the injected `IResumeExtractionProvider` to derive structured
    data (skills, technologies, education, summary) from raw resume text.
    Separate from `ParsingService` (SRP) so provider-level changes never
    require touching file-reading logic.

    The provider's output is untrusted input (regex heuristics or an
    LLM) and is always passed through `ResumeExtractionValidator` before
    anything is written to the database.
    """

    def __init__(
        self,
        provider: IResumeExtractionProvider,
        repo: ResumeRepository | None = None,
        skill_repo: ExtractedSkillRepository | None = None,
        validator: ResumeExtractionValidator | None = None,
    ):
        super().__init__()
        self._provider = provider
        self._repo = repo or ResumeRepository()
        self._skill_repo = skill_repo or ExtractedSkillRepository()
        self._validator = validator or ResumeExtractionValidator()

    @transaction.atomic
    def extract(self, *, resume: Resume) -> Resume:
        resume.status = Resume.Status.PROCESSING
        self._repo.update(resume, status=resume.status)
        try:
            raw_result = self._provider.parse(resume.file.path)
            result = self._validator.validate(raw_result)
        except Exception as exc:  # noqa: BLE001
            resume.status = Resume.Status.FAILED
            resume.failure_reason = str(exc)
            self._repo.update(resume, status=resume.status, failure_reason=resume.failure_reason)
            self.logger.exception("Extraction failed for resume %s", resume.id)
            raise

        resume.summary = result.summary
        resume.experience_years = result.experience_years
        resume.skills = result.skills
        resume.technologies = result.technologies
        resume.education = result.education
        resume.raw_text = result.raw_text or resume.raw_text
        resume.experience = result.experience
        resume.projects = result.projects
        resume.status = Resume.Status.PROCESSED
        self._repo.update(
            resume,
            summary=resume.summary,
            experience_years=resume.experience_years,
            skills=resume.skills,
            technologies=resume.technologies,
            education=resume.education,
            raw_text=resume.raw_text,
            experience=resume.experience,
            projects=resume.projects,
            status=resume.status,
        )

        # Persist normalised skill rows for analytics
        all_skills = [{"name": s, "category": "skill"} for s in result.skills] + [
            {"name": t, "category": "technology"} for t in result.technologies
        ]
        self._skill_repo.bulk_create_for_resume(resume=resume, skills=all_skills)
        self.logger.info("Extraction complete for resume %s (%d skills)", resume.id, len(all_skills))
        return resume
