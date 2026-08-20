"""Lightweight, dependency-free notification service.

In-app notifications are always available because they only need the database.
Email delivery is an optional bonus: it only fires if SMTP settings are present
in the environment, and any failure is swallowed so the app keeps working
without SMTP/API credentials configured.
"""
import logging
import os
import smtplib
from email.message import EmailMessage

from sqlalchemy.orm import Session

from ..models import Notification, User

logger = logging.getLogger(__name__)

NOTIFICATION_TYPES = {
    "interview_completed": "Interview completed",
    "assessment_available": "Assessment results available",
    "report_available": "Report available",
}


def create_notification(db: Session, user_id: int, type_: str, message: str, interview_id: int | None = None, title: str | None = None) -> Notification:
    notification = Notification(
        user_id=user_id,
        interview_id=interview_id,
        type=type_,
        title=title or NOTIFICATION_TYPES.get(type_, type_.replace("_", " ").title()),
        message=message,
    )
    db.add(notification)
    db.flush()
    _try_send_email(db.get(User, user_id), notification)
    return notification


def notify_interview_completed(db: Session, user_id: int, interview_id: int) -> None:
    """Create the standard set of notifications once an interview finishes."""
    create_notification(db, user_id, "interview_completed", f"Your interview #{interview_id} has finished. Great job completing it!", interview_id)
    create_notification(db, user_id, "assessment_available", f"Your results for interview #{interview_id} are ready to view.", interview_id)
    create_notification(db, user_id, "report_available", f"A downloadable report for interview #{interview_id} is ready.", interview_id)


def _try_send_email(user: User | None, notification: Notification) -> None:
    """Best-effort email notification. Never raises, never required."""
    host = os.getenv("SMTP_HOST")
    if not host or not user:
        return
    try:
        port = int(os.getenv("SMTP_PORT", "587"))
        sender = os.getenv("SMTP_FROM", "no-reply@smarthire.local")
        username = os.getenv("SMTP_USERNAME")
        password = os.getenv("SMTP_PASSWORD")
        msg = EmailMessage()
        msg["Subject"] = notification.title
        msg["From"] = sender
        msg["To"] = user.email
        msg.set_content(notification.message)
        with smtplib.SMTP(host, port, timeout=5) as server:
            server.starttls()
            if username and password:
                server.login(username, password)
            server.send_message(msg)
    except Exception as exc:  # pragma: no cover - purely best-effort
        logger.warning("Email notification skipped (SMTP unavailable or misconfigured): %s", exc)
