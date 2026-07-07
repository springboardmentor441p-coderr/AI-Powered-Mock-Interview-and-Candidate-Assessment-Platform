from core.services import BaseService

from apps.notification.models import Notification, NotificationType
from apps.notification.services.email_service import EmailService


class NotificationService(BaseService):
    """
    Creates in-app `Notification` rows and delegates email delivery to
    `EmailService`. The two concerns are separated: persistence here,
    delivery in `EmailService`.
    """

    def __init__(self, email_service: EmailService):
        super().__init__()
        self._email = email_service

    def notify(
        self,
        *,
        recipient,
        notification_type: str,
        title: str,
        message: str,
        metadata: dict | None = None,
        send_email: bool = False,
    ) -> Notification:
        notification = Notification.objects.create(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            message=message,
            metadata=metadata or {},
        )
        if send_email and recipient.email:
            self._email._provider.send(
                to=recipient.email, subject=title, body=message
            )
        return notification

    def notify_session_completed(self, *, candidate, session_id: str, overall_score: float) -> Notification:
        notification = self.notify(
            recipient=candidate,
            notification_type=NotificationType.SESSION_COMPLETED,
            title="Your interview results are ready",
            message=f"Your mock interview has been scored: {overall_score:.0f}/100. View your report in the dashboard.",
            metadata={"session_id": session_id, "overall_score": overall_score},
        )
        self._email.send_session_completed(
            to=candidate.email,
            full_name=candidate.get_full_name(),
            session_id=session_id,
            overall_score=overall_score,
        )
        return notification

    def notify_interview_reminder(self, *, candidate, session_id: str, scheduled_for: str) -> Notification:
        return self.notify(
            recipient=candidate,
            notification_type=NotificationType.INTERVIEW_REMINDER,
            title="Upcoming mock interview reminder",
            message=f"You have a scheduled mock interview at {scheduled_for}.",
            metadata={"session_id": session_id},
            send_email=True,
        )


class ReminderService(BaseService):
    """Scheduled reminder dispatching (called from Celery beat)."""

    def __init__(self, notification_service: NotificationService):
        super().__init__()
        self._notifications = notification_service

    def send_upcoming_reminders(self, *, hours_ahead: int = 1) -> int:
        """Find sessions scheduled within `hours_ahead` hours and send reminders."""
        from django.utils import timezone
        from datetime import timedelta
        from apps.interview.models import InterviewSession

        cutoff = timezone.now() + timedelta(hours=hours_ahead)
        sessions = InterviewSession.objects.filter(
            status=InterviewSession.Status.SCHEDULED,
            started_at__isnull=True,
            created_at__lte=cutoff,
        ).select_related("candidate")

        count = 0
        for session in sessions:
            self._notifications.notify_interview_reminder(
                candidate=session.candidate,
                session_id=str(session.id),
                scheduled_for=str(session.created_at),
            )
            count += 1
        self.logger.info("Sent %d interview reminders", count)
        return count
