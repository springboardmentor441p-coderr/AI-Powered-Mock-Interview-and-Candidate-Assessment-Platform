import logging

from celery import shared_task
from django.conf import settings

logger = logging.getLogger("smarthire")


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=15,
    name="apps.notification.tasks.send_invitation_email_task",
)
def send_invitation_email_task(self, invitation_id: str):
    """
    Celery task: generates and sends invitation email to candidate.
    Retries up to 3 times on transient network/email service failures.
    """
    from apps.interview.models import InterviewInvitation, InvitationStatus
    from core.container import container

    invitation = (
        InterviewInvitation.objects.filter(pk=invitation_id)
        .select_related("recruiter", "template")
        .first()
    )
    if invitation is None:
        logger.warning(
            "send_invitation_email_task: invitation %s not found — skipping",
            invitation_id,
        )
        return False

    if invitation.status in (
        InvitationStatus.EXPIRED,
        InvitationStatus.REVOKED,
        InvitationStatus.DECLINED,
    ):
        logger.info(
            "send_invitation_email_task: invitation %s is in state %s — skipping",
            invitation_id,
            invitation.status,
        )
        return False

    frontend_base = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    invite_url = f"{frontend_base}/invite/{invitation.token}"
    recruiter_name = (
        invitation.recruiter.get_full_name() or invitation.recruiter.email  # type: ignore[union-attr]
    )
    template_title = invitation.template.title if invitation.template else "Interview"

    try:
        email_service = container.email_service()
        sent = email_service.send_invitation(
            to=invitation.candidate_email,
            recruiter_name=recruiter_name,
            template_title=template_title,
            invite_url=invite_url,
            message=invitation.message,
        )
        if sent and invitation.status == InvitationStatus.PENDING:
            invitation.status = InvitationStatus.SENT
            invitation.save(update_fields=["status", "updated_at"])
            logger.info(
                "send_invitation_email_task: sent email for invitation %s to %s",
                invitation_id,
                invitation.candidate_email,
            )
        return sent
    except Exception as exc:
        logger.exception(
            "send_invitation_email_task failed for invitation %s: %s",
            invitation_id,
            exc,
        )
        raise self.retry(exc=exc)
