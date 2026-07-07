from core.exceptions import NotFoundError, ValidationError

from apps.resume.models import Resume


def get_owned_resume_or_404(*, candidate, resume_id) -> Resume:
    resume = Resume.objects.filter(pk=resume_id, candidate=candidate).first()
    if resume is None:
        raise NotFoundError("Resume not found.")
    return resume


def get_primary_processed_resume(*, candidate) -> Resume:
    resume = Resume.objects.filter(candidate=candidate, is_primary=True, status=Resume.Status.PROCESSED).first()
    if resume is None:
        raise ValidationError("Candidate has no processed primary resume yet.")
    return resume
