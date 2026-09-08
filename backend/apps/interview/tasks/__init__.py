from datetime import timedelta
import logging

from celery import shared_task
from django.utils import timezone

from apps.interview.tasks.evaluation_tasks import (  # noqa: F401
    evaluate_topic_thread,
    generate_interview_brief,
)

logger = logging.getLogger("smarthire")


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=20,
    name="apps.interview.tasks.generate_seed_topics_task",
)
def generate_seed_topics_task(self, session_id: str, topic_count: int = 6):
    """
    Async Celery task: generates resume-aware seed topics for a realtime
    interview session and persists them as Question rows (status=PENDING).

    Sets session state to PREPARING upon start, READY upon completion,
    and PREPARATION_FAILED if all retries are exhausted.
    """
    from apps.interview.models import InterviewSession
    from core.container import container
    from core.exceptions import ExternalServiceError

    session = InterviewSession.objects.filter(pk=session_id).first()
    if session is None:
        logger.warning("generate_seed_topics_task: session %s not found — skipping", session_id)
        return

    if session.seed_topics_ready and session.seed_topics.exists():
        logger.info(
            "generate_seed_topics_task: session %s already has seed topics — skipping", session_id
        )
        if session.status in (InterviewSession.Status.SCHEDULED, InterviewSession.Status.PREPARING):
            session.status = InterviewSession.Status.READY
            session.save(update_fields=["status", "updated_at"])
        return

    # Transition to PREPARING if currently SCHEDULED
    if session.status == InterviewSession.Status.SCHEDULED:
        session.status = InterviewSession.Status.PREPARING
        session.save(update_fields=["status", "updated_at"])

    try:
        container.seed_topic_service().generate_and_store(
            session=session,
            topic_count=topic_count,
        )
        session.refresh_from_db(fields=["status", "seed_topics_ready"])
        if session.status in (InterviewSession.Status.SCHEDULED, InterviewSession.Status.PREPARING):
            session.status = InterviewSession.Status.READY
            session.save(update_fields=["status", "updated_at"])

        logger.info("generate_seed_topics_task: seed topics ready for session %s", session_id)
    except ExternalServiceError as exc:
        logger.warning(
            "generate_seed_topics_task: transient error for session %s (attempt %d/%d): %s",
            session_id, self.request.retries + 1, self.max_retries + 1, exc,
        )
        if self.request.retries >= self.max_retries:
            session.status = InterviewSession.Status.PREPARATION_FAILED
            session.save(update_fields=["status", "updated_at"])
        raise self.retry(exc=exc)
    except Exception as exc:  # noqa: BLE001
        logger.exception("generate_seed_topics_task: unrecoverable error for session %s", session_id)
        session.status = InterviewSession.Status.PREPARATION_FAILED
        session.save(update_fields=["status", "updated_at"])
        raise


@shared_task(name="apps.interview.tasks.check_stale_sessions_task")
def check_stale_sessions_task():
    """
    Watchdog task: inspects in-progress and connection-lost sessions.
    - If heartbeat missed > 30s: mark CONNECTION_LOST.
    - If heartbeat missed > 90s grace period: mark ABANDONED.
    """
    from apps.interview.models import InterviewSession, InvitationStatus

    now = timezone.now()
    warning_cutoff = now - timedelta(seconds=30)
    abandon_cutoff = now - timedelta(seconds=90)

    # Transition active to connection_lost if heartbeat is older than 30s
    stale_active = InterviewSession.objects.filter(
        status=InterviewSession.Status.IN_PROGRESS,
        last_seen_at__isnull=False,
        last_seen_at__lt=warning_cutoff,
    )
    for s in stale_active:
        s.status = InterviewSession.Status.CONNECTION_LOST
        s.save(update_fields=["status", "updated_at"])
        logger.info("Watchdog: session %s transitioned to CONNECTION_LOST", s.id)

    # Transition connection_lost or long-stale in_progress to abandoned after 90s
    abandoned = InterviewSession.objects.filter(
        status__in=[InterviewSession.Status.IN_PROGRESS, InterviewSession.Status.CONNECTION_LOST],
        last_seen_at__isnull=False,
        last_seen_at__lt=abandon_cutoff,
    )
    count = 0
    for s in abandoned:
        s.status = InterviewSession.Status.ABANDONED
        s.save(update_fields=["status", "updated_at"])
        try:
            inv = s.invitation  # type: ignore[attr-defined]
            if inv and inv.status == InvitationStatus.ACCEPTED:
                inv.status = InvitationStatus.ABANDONED
                inv.save(update_fields=["status", "updated_at"])
        except Exception:
            pass
        count += 1
        logger.info("Watchdog: session %s marked ABANDONED after timeout", s.id)

    return count