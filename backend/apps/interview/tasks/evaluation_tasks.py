"""
Celery tasks for thread-level evaluation and post-interview brief.

Task: evaluate_topic_thread
  Triggered by InterviewOrchestrator.handle_ask_next_question() when
  a topic is done. Fetches all transcript turns for that topic thread
  and evaluates the full conversation — not individual turns.

  Key shift from the old approach:
    OLD: evaluate each candidate turn as it arrives
    NEW: evaluate the full thread when the topic ends

  The full thread exposes bluffing, shallow answers, and whether depth
  increased or collapsed under follow-up probing.

Task: generate_interview_brief
  Triggered by InterviewOrchestrator._complete_session() after the
  call ends. Reads all ThreadEvaluation rows and generates a single
  InterviewBrief for the recruiter.

  Race-condition guard: the task checks that every ASKED seed topic has
  a ThreadEvaluation before generating the brief. If not all are ready
  yet (evaluate_topic_thread may still be running), it reschedules
  itself with a short countdown rather than running on incomplete data.
  Max waits: 5 attempts × 30s = up to 2.5 min before giving up.
"""
import logging

from celery import shared_task

from core.exceptions import ExternalServiceError

logger = logging.getLogger("smarthire")

# How many times generate_interview_brief will reschedule itself waiting
# for all thread evaluations to complete before giving up.
_BRIEF_MAX_READINESS_WAITS = 5
_BRIEF_READINESS_RETRY_DELAY = 30  # seconds


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=20,
    name="apps.interview.tasks.evaluate_topic_thread",
)
def evaluate_topic_thread(self, session_id: str, seed_topic_id: str) -> None:
    """
    Evaluate the complete conversation thread for one seed topic.

    Args:
        session_id:     UUID of the InterviewSession.
        seed_topic_id:  UUID of the Question (seed topic) that was just completed.
    """
    from core.container import container
    from apps.interview.models import ConversationTurn, InterviewSession, Question, ThreadEvaluation, Transcript

    # Idempotency — if already evaluated, skip.
    if ThreadEvaluation.objects.filter(seed_topic_id=seed_topic_id).exists():
        logger.info("evaluate_topic_thread: already evaluated topic %s — skipping.", seed_topic_id)
        return

    session = InterviewSession.objects.filter(pk=session_id).first()
    if session is None:
        logger.warning("evaluate_topic_thread: session %s not found — skipping.", session_id)
        return

    seed_topic = Question.objects.filter(pk=seed_topic_id).first()
    if seed_topic is None:
        logger.warning("evaluate_topic_thread: seed topic %s not found — skipping.", seed_topic_id)
        return

    # ---------------------------------------------------------------------------
    # Build the conversation thread for this topic.
    #
    # Strategy: find all Transcript rows linked to this seed topic. If few
    # are linked (question_id FK wasn't populated by the frontend), fall back
    # to a window — all turns between when this topic was asked and the next
    # topic. This gracefully handles the case where the frontend didn't send
    # question_id on every turn.
    # ---------------------------------------------------------------------------
    linked_turns = list(
        Transcript.objects
        .filter(interview=session, question_id=seed_topic_id)
        .order_by("sequence_number")
    )

    if len(linked_turns) < 2:
        topic_order = seed_topic.order
        next_topic = (
            Question.objects
            .filter(session=session, order__gt=topic_order)
            .order_by("order")
            .first()
        )
        start_ct = (
            ConversationTurn.objects
            .filter(session=session, seed_topic=seed_topic)
            .order_by("order")
            .first()
        )
        if start_ct is not None:
            qs = Transcript.objects.filter(
                interview=session,
                sequence_number__gte=start_ct.order,
            )
            if next_topic is not None:
                end_ct = (
                    ConversationTurn.objects
                    .filter(session=session, seed_topic=next_topic)
                    .order_by("order")
                    .first()
                )
                if end_ct is not None:
                    qs = qs.filter(sequence_number__lt=end_ct.order)
            linked_turns = list(qs.order_by("sequence_number"))
            
    if not linked_turns:
        logger.warning(
            "evaluate_topic_thread: no transcript turns found for topic %s in session %s — skipping.",
            seed_topic_id, session_id,
        )
        return

    # Build the plain conversation list Gemini expects.
    conversation = [
        {"speaker": t.speaker, "text": t.text}
        for t in linked_turns
    ]

    candidate_turns = [t for t in conversation if t["speaker"] == "candidate"]
    logger.info(
        "evaluate_topic_thread: evaluating topic %s — %d total turns, %d candidate turns.",
        seed_topic_id, len(conversation), len(candidate_turns),
    )

    try:
        provider = container.ai_factory().thread_evaluation()
        result = provider.evaluate_thread(
            seed_topic_text=seed_topic.text,
            expected_topics=seed_topic.expected_topics or [],
            conversation=conversation,
            interview_type=session.interview_type,
            domain=session.domain,
            difficulty=session.difficulty,
        )

        ThreadEvaluation.objects.create(
            interview=session,
            seed_topic=seed_topic,
            depth_under_pressure=result.depth_under_pressure,
            conceptual_accuracy=result.conceptual_accuracy,
            specificity=result.specificity,
            recovery=result.recovery,
            overall_score=result.overall_score,
            verdict=result.verdict,
            red_flags=result.red_flags,
            strong_signals=result.strong_signals,
            suggested_followups=result.suggested_followups,
            requires_human_review=result.requires_human_review,
            human_review_reason=result.human_review_reason,
            turn_count=result.turn_count,
            candidate_turn_count=result.candidate_turn_count,
            model_used=result.model_used,
            raw_response=result.raw_response,
        )

        logger.info(
            "evaluate_topic_thread: saved ThreadEvaluation for topic %s (verdict=%s, score=%.1f).",
            seed_topic_id, result.verdict, result.overall_score,
        )

    except ExternalServiceError as exc:
        logger.warning(
            "evaluate_topic_thread: transient error for topic %s (attempt %d/%d): %s",
            seed_topic_id, self.request.retries + 1, self.max_retries + 1, exc,
        )
        raise self.retry(exc=exc)

    except Exception:  # noqa: BLE001
        logger.exception("evaluate_topic_thread: unrecoverable error for topic %s.", seed_topic_id)
        raise


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    name="apps.interview.tasks.generate_interview_brief",
)
def generate_interview_brief(self, session_id: str, _readiness_attempt: int = 0) -> None:
    """
    Generate the post-interview brief after all topics are evaluated.

    Called by _complete_session() after the call ends. Reads all
    ThreadEvaluation rows for the session and writes one InterviewBrief.

    Race-condition guard: every seed topic with status=ASKED must have a
    corresponding ThreadEvaluation before the brief is generated. If some
    are still being evaluated (evaluate_topic_thread is async and may lag),
    this task reschedules itself with a short delay rather than generating
    an incomplete brief. It will wait up to _BRIEF_MAX_READINESS_WAITS
    attempts before proceeding anyway (so a failed evaluate_topic_thread
    doesn't block the brief forever).

    Args:
        session_id:         UUID of the InterviewSession.
        _readiness_attempt: Internal counter — do not pass from callers.
    """
    from core.container import container
    from apps.interview.models import InterviewBrief, InterviewSession, Question, ThreadEvaluation

    # Idempotency.
    if InterviewBrief.objects.filter(interview_id=session_id).exists():
        logger.info("generate_interview_brief: brief already exists for session %s — skipping.", session_id)
        return

    session = InterviewSession.objects.filter(pk=session_id).first()
    if session is None:
        logger.warning("generate_interview_brief: session %s not found — skipping.", session_id)
        return

    # ------------------------------------------------------------------
    # Readiness check: all ASKED seed topics must have a ThreadEvaluation.
    # If not, reschedule rather than generate a partial brief.
    # ------------------------------------------------------------------
    asked_topic_ids = set(
        Question.objects
        .filter(session=session, status=Question.Status.ASKED)
        .values_list("id", flat=True)
    )
    evaluated_topic_ids = set(
        ThreadEvaluation.objects
        .filter(interview=session)
        .values_list("seed_topic_id", flat=True)
    )
    pending_topics = asked_topic_ids - evaluated_topic_ids

    if pending_topics and _readiness_attempt < _BRIEF_MAX_READINESS_WAITS:
        logger.info(
            "generate_interview_brief: %d topic(s) not yet evaluated for session %s "
            "(attempt %d/%d) — rescheduling in %ds.",
            len(pending_topics), session_id,
            _readiness_attempt + 1, _BRIEF_MAX_READINESS_WAITS,
            _BRIEF_READINESS_RETRY_DELAY,
        )
        generate_interview_brief.apply_async( # pyright: ignore[reportCallIssue]
            args=[session_id],
            kwargs={"_readiness_attempt": _readiness_attempt + 1},
            countdown=_BRIEF_READINESS_RETRY_DELAY,
        )
        return

    if pending_topics:
        logger.warning(
            "generate_interview_brief: %d topic(s) still unevaluated after %d waits "
            "for session %s — generating brief on available data.",
            len(pending_topics), _BRIEF_MAX_READINESS_WAITS, session_id,
        )

    # ------------------------------------------------------------------
    # All (or as many as we'll get) thread evaluations are ready.
    # ------------------------------------------------------------------
    thread_evals = list(
        ThreadEvaluation.objects
        .filter(interview=session)
        .select_related("seed_topic")
        .order_by("seed_topic__order")
    )

    if not thread_evals:
        logger.warning(
            "generate_interview_brief: no thread evaluations found for session %s — skipping.", session_id
        )
        return

    # Serialize thread results for the brief provider.
    thread_results = [
        {
            "seed_topic_text": e.seed_topic.text,
            "verdict": e.verdict,
            "overall_score": e.overall_score,
            "depth_under_pressure": e.depth_under_pressure,
            "conceptual_accuracy": e.conceptual_accuracy,
            "specificity": e.specificity,
            "red_flags": e.red_flags,
            "strong_signals": e.strong_signals,
            "suggested_followups": e.suggested_followups,
        }
        for e in thread_evals
    ]

    try:
        provider = container.ai_factory().interview_brief()
        result = provider.generate_brief(
            interview_type=session.interview_type,
            domain=session.domain,
            difficulty=session.difficulty,
            thread_results=thread_results,
        )

        InterviewBrief.objects.create(
            interview=session,
            overall_signal=result.overall_signal,
            summary=result.summary,
            performs_under_pressure=result.performs_under_pressure,
            specificity_consistent=result.specificity_consistent,
            self_contradictions_detected=result.self_contradictions_detected,
            contradiction_detail=result.contradiction_detail,
            red_flags=result.red_flags,
            strong_signals=result.strong_signals,
            suggested_followup_questions=result.suggested_followup_questions,
            requires_human_review=result.requires_human_review,
            model_used=result.model_used,
            raw_response=result.raw_response,
        )

        logger.info(
            "generate_interview_brief: brief saved for session %s (signal=%s).",
            session_id, result.overall_signal,
        )

    except ExternalServiceError as exc:
        logger.warning(
            "generate_interview_brief: transient error for session %s (attempt %d/%d): %s",
            session_id, self.request.retries + 1, self.max_retries + 1, exc,
        )
        raise self.retry(exc=exc)

    except Exception:  # noqa: BLE001
        logger.exception("generate_interview_brief: unrecoverable error for session %s.", session_id)
        raise