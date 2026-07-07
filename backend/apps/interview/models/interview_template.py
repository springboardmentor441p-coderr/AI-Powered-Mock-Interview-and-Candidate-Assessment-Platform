import uuid

from django.conf import settings
from django.db import models


class InterviewType(models.TextChoices):
    TECHNICAL = "technical", "Technical"
    HR = "hr", "HR"
    BEHAVIORAL = "behavioral", "Behavioral"
    APTITUDE = "aptitude", "Aptitude"


class Difficulty(models.TextChoices):
    EASY = "easy", "Easy"
    MEDIUM = "medium", "Medium"
    HARD = "hard", "Hard"


class InterviewTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    interview_type = models.CharField(max_length=20, choices=InterviewType.choices)
    domain = models.CharField(max_length=120)
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices, default=Difficulty.MEDIUM)
    question_count = models.PositiveSmallIntegerField(default=5)
    duration_minutes = models.PositiveSmallIntegerField(default=30)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="interview_templates"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "interview"
        db_table = "interview_templates"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.interview_type})"
