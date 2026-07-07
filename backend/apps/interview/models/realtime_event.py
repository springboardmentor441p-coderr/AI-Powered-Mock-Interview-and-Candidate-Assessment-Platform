import uuid

from django.db import models


class RealtimeEventLog(models.Model):
    """
    Raw audit trail of every webhook event received from the realtime
    voice provider (Ultravox) for a session. Kept separate from
    `ConversationTurn` (which is the *interpreted* conversation) so we
    always have the original payload for debugging/replay even if our
    interpretation logic changes later.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey("interview.InterviewSession", on_delete=models.CASCADE, related_name="realtime_events")
    session_id: uuid.UUID
    provider = models.CharField(max_length=20, default="ultravox")
    event_type = models.CharField(max_length=50, db_index=True)
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "interview"
        db_table = "interview_realtime_events"
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"RealtimeEvent({self.session_id}, {self.event_type})"
