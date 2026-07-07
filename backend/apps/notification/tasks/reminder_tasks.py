import logging

from celery import shared_task

logger = logging.getLogger("smarthire")


@shared_task
def send_reminder_task():
    """Celery beat task: check for sessions due soon and send reminders."""
    from core.container import container
    count = container.reminder_service().send_upcoming_reminders(hours_ahead=1)
    logger.info("send_reminder_task: dispatched %d reminders", count)
    return count
