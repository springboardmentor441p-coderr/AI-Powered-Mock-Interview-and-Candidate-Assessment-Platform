import uuid
from django.db import models


class PerformanceRating(models.TextChoices):
    EXCELLENT = "excellent", "Excellent"
    GOOD = "good", "Good"
    AVERAGE = "average", "Average"
    NEEDS_IMPROVEMENT = "needs_improvement", "Needs Improvement"
    POOR = "poor", "Poor"


class FinalScore(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField("interview.InterviewSession", on_delete=models.CASCADE, related_name="final_score")
    session_id: uuid.UUID
    communication = models.FloatField()
    confidence = models.FloatField()
    technical_relevance = models.FloatField()
    professionalism = models.FloatField()
    overall = models.FloatField(db_index=True)
    rating = models.CharField(max_length=20, choices=PerformanceRating.choices)
    breakdown = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "assessment"
        db_table = "final_scores"
        ordering = ["-created_at"]

    def __str__(self):
        return f"FinalScore({self.session_id}) = {self.overall} ({self.rating})"
