import uuid
from django.db import models


class TechnicalScore(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField("interview.InterviewSession", on_delete=models.CASCADE, related_name="technical_score")
    keyword_coverage = models.FloatField()
    completeness = models.FloatField()
    answered_ratio = models.FloatField()
    total = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "assessment"
        db_table = "technical_scores"
