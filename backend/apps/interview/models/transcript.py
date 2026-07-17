"""
Transcript: individual conversation turns stored as they arrive from
Ultravox, not as a post-call blob. Each row is one finalized speech
segment from either the AI or the candidate.

Design rationale
----------------
- One row per turn  →  can replay the interview in order, evaluate
  per-answer, build a live transcript view, and survive reconnects.
- Save immediately  →  no data loss if the browser closes mid-call.
- Separate from ConversationTurn  →  ConversationTurn is written by the
  orchestrator (AI-side, question labels, barge-in metadata). Transcript
  is written by the Ultravox webhook transcript event — the raw spoken
  words from both sides, sequenced by Ultravox's own numbering.
- question_id (nullable)  →  links a candidate turn back to the seed
  topic that provoked it so the evaluator knows what was being asked.
- is_followup  →  lets analytics distinguish follow-up answers from
  first-pass answers without re-parsing the full transcript.
- latency_ms  →  gap between the previous turn ending and this one
  starting; useful for engagement / fluency analysis.
- confidence  →  ASR confidence score forwarded from Ultravox (0–1),
  useful for filtering out low-quality segments before evaluation.
"""
import uuid

from django.db import models


class Transcript(models.Model):
    class Speaker(models.TextChoices):
        ASSISTANT = "assistant", "AI Interviewer"
        CANDIDATE = "candidate", "Candidate"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    interview = models.ForeignKey(
        "interview.InterviewSession",
        on_delete=models.CASCADE,
        related_name="transcript_turns",
        db_index=True,
    )

    speaker = models.CharField(max_length=12, choices=Speaker.choices)
    text = models.TextField()

    # Ordering field — Ultravox sends an incrementing index per call;
    # we store it so rows can be replayed in the correct order even if
    # they arrive out-of-order over the network.
    sequence_number = models.PositiveIntegerField()

    # Wall-clock position of this turn relative to the call start (ms).
    # Allows building a timeline and computing latency between turns.
    timestamp = models.DateTimeField(
        null=True, blank=True,
        help_text="UTC wall-clock time when this turn was finalised by Ultravox.",
    )

    # Optional link to the seed topic (Question) that prompted this
    # candidate turn.  NULL for AI turns and for candidate turns that
    # arrived before any specific seed topic was asked.
    question = models.ForeignKey(
        "interview.Question",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transcript_turns",
    )

    # True when this turn is a candidate's response to a follow-up
    # question rather than the first answer on a topic.
    is_followup = models.BooleanField(default=False)

    # Gap in ms between the end of the *previous* finalized turn and
    # the start of this one.  Computed at save time from the Ultravox
    # event timestamps.  NULL if not provided.
    latency_ms = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Response latency in ms (time between previous turn ending and this one starting).",
    )

    # ASR confidence forwarded from Ultravox (0.0–1.0).  NULL if
    # Ultravox does not emit it for this segment.  Evaluators can
    # skip turns below a threshold (e.g. < 0.6).
    confidence = models.FloatField(
        null=True, blank=True,
        help_text="ASR confidence score from Ultravox (0.0–1.0).",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "interview"
        db_table = "interview_transcripts"
        ordering = ["sequence_number"]
        indexes = [
            models.Index(fields=["interview", "sequence_number"]),
            models.Index(fields=["interview", "speaker"]),
        ]
        # Prevent double-inserts if the webhook fires twice for the
        # same turn (Ultravox at-least-once delivery guarantee).
        unique_together = [("interview", "sequence_number")]

    def __str__(self) -> str:
        return f"Transcript(interview={self.interview_id}, seq={self.sequence_number}, speaker={self.speaker})"  # type: ignore[attr-defined]