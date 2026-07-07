from core.services import BaseService

from apps.notification.providers.interfaces import IEmailProvider


class EmailService(BaseService):
    """
    Sends transactional emails via the injected `IEmailProvider`.
    Keeps template/subject logic here so providers stay pure adapters.
    """

    def __init__(self, provider: IEmailProvider):
        super().__init__()
        self._provider = provider

    def send_session_completed(self, *, to: str, full_name: str, session_id: str, overall_score: float) -> bool:
        subject = "Your SmartHire AI interview results are ready"
        body = (
            f"Hi {full_name},\n\n"
            f"Your mock interview has been scored: {overall_score:.0f}/100.\n"
            f"Log in to view your full feedback report and improvement suggestions.\n\n"
            f"Session ID: {session_id}\n\n"
            "— SmartHire AI Team"
        )
        return self._provider.send(to=to, subject=subject, body=body)

    def send_interview_reminder(self, *, to: str, full_name: str, session_id: str, scheduled_for: str) -> bool:
        subject = "Reminder: Upcoming SmartHire AI mock interview"
        body = (
            f"Hi {full_name},\n\n"
            f"This is a reminder that you have a scheduled mock interview at {scheduled_for}.\n"
            f"Session ID: {session_id}\n\n"
            "— SmartHire AI Team"
        )
        return self._provider.send(to=to, subject=subject, body=body)
