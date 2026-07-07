import uuid

from django.conf import settings
from django.db import models


class InterviewSession(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        ABANDONED = "abandoned", "Abandoned"

    class Mode(models.TextChoices):
        SCRIPTED = "scripted", "Scripted (legacy, turn-by-turn)"
        REALTIME = "realtime", "Realtime voice conversation"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="interview_sessions"
    )
    candidate_id: uuid.UUID
    template = models.ForeignKey(
        "interview.InterviewTemplate", on_delete=models.SET_NULL, null=True, blank=True, related_name="sessions"
    )
    resume = models.ForeignKey(
        "resume.Resume", on_delete=models.SET_NULL, null=True, blank=True, related_name="interview_sessions"
    )
    interview_type = models.CharField(max_length=20)
    domain = models.CharField(max_length=120, blank=True)
    difficulty = models.CharField(max_length=10, default="medium")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED, db_index=True)
    mode = models.CharField(max_length=10, choices=Mode.choices, default=Mode.REALTIME, db_index=True)

    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)

    video_recording = models.FileField(upload_to="sessions/video/", null=True, blank=True)
    audio_recording = models.FileField(upload_to="sessions/audio/", null=True, blank=True)

    # --- Realtime voice call fields (populated once InterviewOrchestrator starts the call) ---
    realtime_provider = models.CharField(max_length=20, blank=True, default="")
    call_id = models.CharField(max_length=255, blank=True, default="", db_index=True)
    call_join_url = models.URLField(max_length=1000, blank=True, default="")
    interrupt_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "interview"
        db_table = "interview_sessions"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["candidate", "status"])]

    def __str__(self) -> str:
        return f"Session({self.candidate_id}, {self.interview_type}, {self.status})"
