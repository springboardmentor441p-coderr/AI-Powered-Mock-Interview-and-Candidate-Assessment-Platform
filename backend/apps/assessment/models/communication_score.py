import uuid
from django.db import models


class CommunicationScore(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField("interview.InterviewSession", on_delete=models.CASCADE, related_name="communication_score")
    grammar_score = models.FloatField()
    clarity_score = models.FloatField()
    completeness_score = models.FloatField()
    filler_penalty = models.FloatField(default=0)
    pace_score = models.FloatField()
    total = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "assessment"
        db_table = "communication_scores"
