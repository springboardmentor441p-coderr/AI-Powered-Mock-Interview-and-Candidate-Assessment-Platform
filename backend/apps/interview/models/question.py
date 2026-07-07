import uuid

from django.db import models


class Question(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ASKED = "asked", "Asked"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(
        "interview.InterviewTemplate", on_delete=models.CASCADE, related_name="questions", null=True, blank=True
    )
    # Set for realtime-mode sessions: this question is a seed topic pulled
    # live from the pool by InterviewOrchestrator.handle_ask_next_question,
    # rather than a fixed pre-scripted question. Left null for legacy
    # scripted sessions, where questions hang off `template` + `Answer` instead.
    session = models.ForeignKey(
        "interview.InterviewSession", on_delete=models.CASCADE, related_name="seed_topics", null=True, blank=True
    )
    text = models.TextField()
    category = models.CharField(max_length=20)
    difficulty = models.CharField(max_length=10, default="medium")
    expected_topics = models.JSONField(default=list, blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    is_ai_generated = models.BooleanField(default=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "interview"
        db_table = "interview_questions"
        ordering = ["order", "created_at"]

    def __str__(self) -> str:
        return self.text[:80]
