import uuid
from django.db import models


class ProfessionalismScore(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField("interview.InterviewSession", on_delete=models.CASCADE, related_name="professionalism_score")
    time_management_score = models.FloatField()
    organization_score = models.FloatField()
    filler_penalty = models.FloatField(default=0)
    total = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "assessment"
        db_table = "professionalism_scores"
