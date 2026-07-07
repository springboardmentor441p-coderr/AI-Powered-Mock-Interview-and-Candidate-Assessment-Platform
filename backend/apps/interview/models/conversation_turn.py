import uuid

from django.db import models


class ConversationTurn(models.Model):
    """
    One turn in a live interview conversation.

    Unlike `Answer` (which assumes a fixed pre-generated question list),
    turns are appended as the Ultravox call actually happens - in
    whatever order the conversation takes, including interruptions and
    follow-ups that were never pre-scripted.
    """

    class Speaker(models.TextChoices):
        AI = "ai", "AI Interviewer"
        CANDIDATE = "candidate", "Candidate"

    class TurnType(models.TextChoices):
        QUESTION = "question", "Question"
        FOLLOW_UP = "follow_up", "Follow-up"
        ANSWER = "answer", "Answer"
        CLARIFICATION = "clarification", "Clarification"
        SMALL_TALK = "small_talk", "Small talk"
        SYSTEM = "system", "System"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey("interview.InterviewSession", on_delete=models.CASCADE, related_name="turns")
    session_id: uuid.UUID
    seed_topic = models.ForeignKey(
        "interview.Question", on_delete=models.SET_NULL, null=True, blank=True, related_name="turns"
    )

    speaker = models.CharField(max_length=10, choices=Speaker.choices)
    turn_type = models.CharField(max_length=20, choices=TurnType.choices, default=TurnType.ANSWER)
    text = models.TextField(blank=True)

    order = models.PositiveIntegerField(default=0)
    started_at_ms = models.PositiveIntegerField(null=True, blank=True)
    ended_at_ms = models.PositiveIntegerField(null=True, blank=True)
    was_interrupted = models.BooleanField(
        default=False, help_text="True if the candidate started speaking before this turn finished."
    )
    metadata = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "interview"
        db_table = "interview_conversation_turns"
        ordering = ["order", "created_at"]
        indexes = [models.Index(fields=["session", "order"])]

    def __str__(self) -> str:
        return f"Turn({self.session_id}, #{self.order}, {self.speaker})"
