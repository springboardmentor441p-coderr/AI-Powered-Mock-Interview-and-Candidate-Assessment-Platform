from typing import Optional

from core.repositories import DjangoModelRepository

from apps.resume.models import ExtractedSkill, Resume


class ResumeRepository(DjangoModelRepository[Resume]):
    model = Resume

    def get_primary_processed(self, *, candidate) -> Optional[Resume]:
        return self.model.objects.filter(
            candidate=candidate, is_primary=True, status=Resume.Status.PROCESSED
        ).first()

    def set_all_non_primary(self, *, candidate, exclude_id=None) -> None:
        qs = self.model.objects.filter(candidate=candidate)
        if exclude_id:
            qs = qs.exclude(pk=exclude_id)
        qs.update(is_primary=False)

    def get_owned_or_none(self, *, candidate, resume_id) -> Optional[Resume]:
        return self.model.objects.filter(pk=resume_id, candidate=candidate).first()


class ExtractedSkillRepository(DjangoModelRepository[ExtractedSkill]):
    model = ExtractedSkill

    def bulk_create_for_resume(self, *, resume: Resume, skills: list[dict]) -> list[ExtractedSkill]:
        ExtractedSkill.objects.filter(resume=resume).delete()
        objs = [ExtractedSkill(resume=resume, **skill) for skill in skills]
        return ExtractedSkill.objects.bulk_create(objs, ignore_conflicts=True)
