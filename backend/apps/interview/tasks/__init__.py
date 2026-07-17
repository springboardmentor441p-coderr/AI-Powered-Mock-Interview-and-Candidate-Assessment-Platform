import logging

from celery import shared_task

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

    Called immediately after session creation so the HTTP response is instant.
    Retries up to 3 times on transient Gemini/network errors with a 20-second
    back-off before each retry.

    Args:
        session_id: UUID string of the InterviewSession.
        topic_count: How many seed topics to generate (default 6).
    """
    from core.container import container
    from apps.interview.models import InterviewSession
    from core.exceptions import ExternalServiceError

    session = InterviewSession.objects.filter(pk=session_id).first()
    if session is None:
        logger.warning("generate_seed_topics_task: session %s not found — skipping", session_id)
        return

    if session.seed_topics_ready:
        logger.info(
            "generate_seed_topics_task: session %s already has seed topics — skipping", session_id
        )
        return

    try:
        container.seed_topic_service().generate_and_store(
            session=session,
            topic_count=topic_count,
        )
        logger.info(
            "generate_seed_topics_task: seed topics ready for session %s", session_id
        )
    except ExternalServiceError as exc:
        logger.warning(
            "generate_seed_topics_task: transient error for session %s (attempt %d/%d): %s",
            session_id, self.request.retries + 1, self.max_retries + 1, exc,
        )
        raise self.retry(exc=exc)
    except Exception as exc:  # noqa: BLE001
        logger.exception(
            "generate_seed_topics_task: unrecoverable error for session %s", session_id
        )
        raise