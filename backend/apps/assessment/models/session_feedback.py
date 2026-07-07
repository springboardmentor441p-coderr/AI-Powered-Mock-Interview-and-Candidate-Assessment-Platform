import uuid
from django.db import models


class SessionFeedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField(
        "interview.InterviewSession", on_delete=models.CASCADE, related_name="feedback"
    )
    strengths = models.JSONField(default=list)
    weaknesses = models.JSONField(default=list)
    improvement_suggestions = models.JSONField(default=list)
    practice_recommendations = models.JSONField(default=list)
    learning_resources = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "assessment"
        db_table = "session_feedback"
