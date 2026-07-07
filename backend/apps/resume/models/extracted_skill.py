import uuid

from django.db import models


class ExtractedSkill(models.Model):
    """
    Normalised skill record derived from a parsed resume.
    Stored as individual rows (not just JSON) so skills can be queried,
    filtered, and aggregated across candidates in analytics.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resume = models.ForeignKey(
        "resume.Resume", on_delete=models.CASCADE, related_name="extracted_skills"
    )
    name = models.CharField(max_length=120, db_index=True)
    category = models.CharField(
        max_length=30,
        choices=[("skill", "Skill"), ("technology", "Technology"), ("tool", "Tool")],
        default="skill",
    )
    confidence = models.FloatField(default=1.0)

    class Meta:
        app_label = "resume"
        db_table = "extracted_skills"
        unique_together = [("resume", "name")]

    def __str__(self) -> str:
        return f"{self.name} ({self.category})"
