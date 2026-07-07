import os
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import models


def _validate_resume_file(file) -> None:
    ext = os.path.splitext(file.name)[1].lower()
    allowed = getattr(settings, "RESUME_ALLOWED_EXTENSIONS", [".pdf", ".doc", ".docx"])
    if ext not in allowed:
        raise DjangoValidationError(f"Unsupported file type '{ext}'. Allowed: {', '.join(allowed)}")
    max_bytes = getattr(settings, "RESUME_UPLOAD_MAX_SIZE_MB", 5) * 1024 * 1024
    if file.size > max_bytes:
        raise DjangoValidationError(f"File too large. Max {settings.RESUME_UPLOAD_MAX_SIZE_MB}MB.")


def _upload_path(instance: "Resume", filename: str) -> str:
    return f"resumes/{instance.candidate_id}/{filename}"


class Resume(models.Model):
    class Status(models.TextChoices):
        UPLOADED = "uploaded", "Uploaded"
        PROCESSING = "processing", "Processing"
        PROCESSED = "processed", "Processed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    candidate = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="resumes")
    candidate_id: uuid.UUID
    file = models.FileField(upload_to=_upload_path, validators=[_validate_resume_file])
    original_filename = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UPLOADED, db_index=True)

    raw_text = models.TextField(blank=True)
    summary = models.TextField(blank=True)
    experience_years = models.FloatField(null=True, blank=True)
    skills = models.JSONField(default=list, blank=True)
    technologies = models.JSONField(default=list, blank=True)
    education = models.JSONField(default=list, blank=True)
    experience = models.JSONField(default=list, blank=True)   
    projects = models.JSONField(default=list, blank=True)     

    failure_reason = models.TextField(blank=True)
    is_primary = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "resume"
        db_table = "resumes"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["candidate", "status"])]

    def __str__(self) -> str:
        return f"Resume({self.original_filename}) - {self.candidate_id}"
