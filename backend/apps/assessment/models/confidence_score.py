import uuid
from django.db import models


class ConfidenceScore(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField("interview.InterviewSession", on_delete=models.CASCADE, related_name="confidence_score")
    eye_contact_score = models.FloatField()
    attention_score = models.FloatField()
    engagement_score = models.FloatField()
    emotion_confidence = models.FloatField()
    total = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "assessment"
        db_table = "confidence_scores"
