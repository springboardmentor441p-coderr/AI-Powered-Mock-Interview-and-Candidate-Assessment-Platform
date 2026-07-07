import uuid

from django.conf import settings
from django.db import models


class CandidateProfile(models.Model):
    """Extended profile data specific to candidates."""

    class ExperienceLevel(models.TextChoices):
        FRESHER = "fresher", "Fresher"
        JUNIOR = "junior", "Junior"
        MID = "mid", "Mid"
        SENIOR = "senior", "Senior"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="candidate_profile")
    headline = models.CharField(max_length=255, blank=True)
    target_role = models.CharField(max_length=255, blank=True)
    experience_level = models.CharField(
        max_length=20, choices=ExperienceLevel.choices, default=ExperienceLevel.FRESHER
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "candidate"
        db_table = "candidate_profiles"

    def __str__(self) -> str:
        return f"Candidate profile: {self.user.email}"
