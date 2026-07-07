import uuid

from django.db import models


class SpeechAnalysis(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RUNNING = "running", "Running"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField("interview.InterviewSession", on_delete=models.CASCADE, related_name="speech_analysis")
    session_id: uuid.UUID
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)

    transcript = models.TextField(blank=True)
    transcription_confidence = models.FloatField(null=True, blank=True)
    grammar_score = models.FloatField(null=True, blank=True)
    filler_word_count = models.PositiveIntegerField(null=True, blank=True)
    filler_words = models.JSONField(default=list, blank=True)
    speaking_pace_wpm = models.FloatField(null=True, blank=True)
    clarity_score = models.FloatField(null=True, blank=True)
    completeness_score = models.FloatField(null=True, blank=True)

    dominant_emotion = models.CharField(max_length=30, blank=True)
    emotion_breakdown = models.JSONField(default=dict, blank=True)
    eye_contact_percentage = models.FloatField(null=True, blank=True)
    attention_score = models.FloatField(null=True, blank=True)
    engagement_score = models.FloatField(null=True, blank=True)
    confidence_score = models.FloatField(null=True, blank=True)

    failure_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "assessment"
        db_table = "speech_analyses"

    def __str__(self):
        return f"SpeechAnalysis({self.session_id}) - {self.status}"
