import logging

from celery import shared_task

from core.exceptions import ExternalServiceError

logger = logging.getLogger("smarthire")


@shared_task(bind=True, max_retries=3, default_retry_delay=15)
def run_assessment_pipeline(self, session_id: str):
    """Full post-interview pipeline: speech analysis -> scoring -> feedback -> notification."""
    from core.container import container
    from apps.interview.models import InterviewSession

    session = InterviewSession.objects.filter(pk=session_id).first()
    if session is None:
        logger.warning("run_assessment_pipeline: session %s not found", session_id)
        return

    try:
        container.speech_analysis_service().run(session=session)
        container.scoring_service().score_session(session=session)
        container.feedback_service().generate(session=session)

        score = getattr(session, "final_score", None)
        if score:
            container.notification_service().notify_session_completed(
                candidate=session.candidate,
                session_id=str(session.id),
                overall_score=score.overall,
            )

    except ExternalServiceError as exc:
        logger.warning(
            "run_assessment_pipeline: transient error for session %s (attempt %d/%d): %s",
            session_id, self.request.retries + 1, self.max_retries + 1, exc,
        )
        raise self.retry(exc=exc)

    except Exception:
        logger.exception("run_assessment_pipeline: unrecoverable error for session %s", session_id)
        raise