"""
SMTP email provider.

Delegates to Django's built-in `send_mail`, which honours whatever
`EMAIL_BACKEND` is configured (console in dev, SMTP in prod). No
custom SMTP transport code is written; Django's mail framework is
reused in full (DRY / Don't re-invent).
"""
import logging

from django.conf import settings
from django.core.mail import send_mail

from apps.notification.providers.interfaces import IEmailProvider

logger = logging.getLogger("smarthire")


class SMTPEmailProvider(IEmailProvider):
    """Uses Django's `send_mail` → `EMAIL_BACKEND` pipeline."""

    def send(self, *, to: str, subject: str, body: str, html_body: str | None = None) -> bool:
        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to],
                html_message=html_body,
                fail_silently=False,
            )
            return True
        except Exception as exc:  # noqa: BLE001
            logger.exception("SMTPEmailProvider failed to send to %s: %s", to, exc)
            return False
