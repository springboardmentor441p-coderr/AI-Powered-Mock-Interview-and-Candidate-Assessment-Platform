import logging

from celery import shared_task

logger = logging.getLogger("smarthire")


@shared_task(bind=True, max_retries=3, default_retry_delay=15)
def process_resume_task(self, resume_id: str):
    """Full async pipeline: parse file -> extract skills -> generate summary.

    Each stage is skipped if its output is already present on the resume,
    so Celery retries (triggered by transient Gemini/OpenAI 503s) don't
    redundantly re-run completed stages from the top.
    """
    from core.container import container
    from apps.resume.models import Resume
    from core.exceptions import ExternalServiceError

    resume = Resume.objects.filter(pk=resume_id).first()
    if resume is None:
        logger.warning("process_resume_task: resume %s not found", resume_id)
        return

    try:
        # Stage 1: extract raw text - skip if already done
        if not resume.raw_text:
            container.parsing_service().parse(resume=resume)
            resume.refresh_from_db()

        # Stage 2: AI extraction - skip if already processed
        if resume.status != Resume.Status.PROCESSED:
            container.extraction_service().extract(resume=resume)
            resume.refresh_from_db()

        # Stage 3: summary - skip if already generated
        if not resume.summary:
            container.summary_service().generate(resume=resume)

    except ExternalServiceError as exc:
        # Transient external API errors (503s, timeouts) - retry the task
        logger.warning(
            "process_resume_task: transient error for resume %s (attempt %d/%d): %s",
            resume_id, self.request.retries + 1, self.max_retries + 1, exc,
        )
        raise self.retry(exc=exc)
    except Exception as exc:  # noqa: BLE001
        # Non-retryable error - log and let it fail permanently
        logger.exception("process_resume_task: unrecoverable error for resume %s", resume_id)
        raise
