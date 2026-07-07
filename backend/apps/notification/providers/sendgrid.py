"""
SendGrid email provider adapter.

Activated when `EMAIL_PROVIDER=sendgrid` is set. The `sendgrid`
package is imported lazily so the rest of the app never requires it
when using the default SMTP backend.
"""
import logging

from django.conf import settings

from apps.notification.providers.interfaces import IEmailProvider

logger = logging.getLogger("smarthire")


class SendGridEmailProvider(IEmailProvider):
    """Uses the official `sendgrid` Python library."""

    def send(self, *, to: str, subject: str, body: str, html_body: str | None = None) -> bool:
        try:
            import sendgrid
            from sendgrid.helpers.mail import Content, Email, Mail, To
        except ImportError:
            logger.error("SendGrid package not installed. Install sendgrid>=6.0.")
            return False

        sg = sendgrid.SendGridAPIClient(api_key=getattr(settings, "SENDGRID_API_KEY", ""))
        mail = Mail(
            from_email=Email(settings.DEFAULT_FROM_EMAIL),
            to_emails=To(to),
            subject=subject,
            plain_text_content=Content("text/plain", body),
        )
        if html_body:
            mail.add_content(Content("text/html", html_body))
        try:
            response = sg.send(mail)
            success = 200 <= response.status_code < 300
            if not success:
                logger.warning("SendGrid returned status %s for %s", response.status_code, to)
            return success
        except Exception as exc:  # noqa: BLE001
            logger.exception("SendGridEmailProvider failed for %s: %s", to, exc)
            return False
