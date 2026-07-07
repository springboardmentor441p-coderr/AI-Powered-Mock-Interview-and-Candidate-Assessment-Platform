from abc import ABC, abstractmethod


class IEmailProvider(ABC):
    """Port for email delivery. Any concrete backend (SMTP, SendGrid, SES)
    implements this and is injected via the DI container."""

    @abstractmethod
    def send(self, *, to: str, subject: str, body: str, html_body: str | None = None) -> bool:
        """Returns True on success, False on failure (never raises - callers
        should log the return value and continue)."""
        ...
