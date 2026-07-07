import uuid

from django.db import models


class Answer(models.Model):
    """A candidate's response to one question within a session."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey("interview.InterviewSession", on_delete=models.CASCADE, related_name="answers")
    session_id: uuid.UUID
    question = models.ForeignKey("interview.Question", on_delete=models.SET_NULL, null=True, related_name="+")
    question_text = models.TextField()
    order = models.PositiveSmallIntegerField(default=0)

    answer_text = models.TextField(blank=True)
    answer_audio = models.FileField(upload_to="sessions/answers/audio/", null=True, blank=True)
    answer_video = models.FileField(upload_to="sessions/answers/video/", null=True, blank=True)
    response_time_seconds = models.FloatField(null=True, blank=True)
    answered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        app_label = "interview"
        db_table = "session_answers"
        ordering = ["order"]

    def __str__(self) -> str:
        return f"Answer(session={self.session_id}, order={self.order})"
