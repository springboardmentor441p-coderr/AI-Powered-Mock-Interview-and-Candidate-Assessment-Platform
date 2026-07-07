import uuid

from django.conf import settings
from django.db import models


class NotificationType(models.TextChoices):
    INTERVIEW_REMINDER = "interview_reminder", "Interview Reminder"
    SESSION_COMPLETED = "session_completed", "Session Completed"
    REPORT_READY = "report_ready", "Report Ready"
    SYSTEM_ALERT = "system_alert", "System Alert"


class Notification(models.Model):
    """In-app notification record. Email delivery is separate (see providers/)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    recipient_id: uuid.UUID
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "notification"
        db_table = "notifications"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["recipient", "is_read"])]

    def __str__(self) -> str:
        return f"{self.notification_type} -> {self.recipient_id}"
