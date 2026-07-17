"""
TranscriptService
-----------------
Saves individual transcript turns as Ultravox events arrive via the
frontend relay webhook. Evaluation is NOT triggered here — it is
triggered by the orchestrator when a topic thread ends (ask_next_question)
and when the session completes. This keeps the service focused on
storage only.

Key principles:
  - Save first, evaluate later (orchestrator's responsibility).
  - Idempotent on sequence_number — duplicate webhook delivery is safe.
"""
import logging
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from django.db import IntegrityError, transaction
from django.db.models import QuerySet
from django.utils import timezone

from core.services import BaseService

from apps.interview.models import InterviewSession, Question, Transcript

if TYPE_CHECKING:
    pass

logger = logging.getLogger("smarthire")


class TranscriptService(BaseService):
    """Save transcript turns from Ultravox webhook events."""

    @transaction.atomic
    def save_turn(
        self,
        *,
        interview: InterviewSession,
        speaker: str,
        text: str,
        sequence_number: int,
        timestamp: Optional[datetime] = None,
        question: Optional[Question] = None,
        is_followup: bool = False,
        latency_ms: Optional[int] = None,
        confidence: Optional[float] = None,
    ) -> Transcript:
        """
        Create one Transcript row from a single Ultravox transcript event.

        Idempotent: if (interview, sequence_number) already exists
        (duplicate webhook delivery), returns the existing row unchanged.
        """
        try:
            with transaction.atomic():
                turn = Transcript.objects.create(
                    interview=interview,
                    speaker=speaker,
                    text=text,
                    sequence_number=sequence_number,
                    timestamp=timestamp or timezone.now(),
                    question=question,
                    is_followup=is_followup,
                    latency_ms=latency_ms,
                    confidence=confidence,
                )
        except IntegrityError:
            logger.info(
                "TranscriptService.save_turn: duplicate seq=%s for interview %s — returning existing.",
                sequence_number,
                interview.id,
            )
            return Transcript.objects.get(interview=interview, sequence_number=sequence_number)

        logger.debug(
            "TranscriptService: saved turn seq=%s speaker=%s interview=%s",
            sequence_number,
            speaker,
            interview.id,
        )
        return turn

    def get_ordered_turns(self, interview: InterviewSession) -> QuerySet:
        """All transcript turns for an interview in conversation order."""
        return interview.transcript_turns.order_by("sequence_number")  # type: ignore[attr-defined]

    def get_candidate_turns(self, interview: InterviewSession) -> QuerySet:
        """Only candidate answer turns, ordered by sequence."""
        return (
            interview.transcript_turns  # type: ignore[attr-defined]
            .filter(speaker=Transcript.Speaker.CANDIDATE)
            .order_by("sequence_number")
        )