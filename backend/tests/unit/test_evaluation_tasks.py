"""
Unit tests for apps/interview/tasks/evaluation_tasks.py

Covers:
  - evaluate_topic_thread: idempotency, no-session, no-topic,
    no-turns, happy path, ExternalServiceError retry, unrecoverable error
  - generate_interview_brief: idempotency, no-session, readiness-check
    rescheduling, max-wait passthrough, no-evals skip, happy path,
    ExternalServiceError retry
"""
import uuid
from unittest.mock import MagicMock, patch, call

import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_session(session_id=None, interview_type="technical", domain="backend", difficulty="mid"):
    m = MagicMock()
    m.id = uuid.UUID(session_id) if session_id else uuid.uuid4()
    m.interview_type = interview_type
    m.domain = domain
    m.difficulty = difficulty
    return m


def _make_topic(topic_id=None, text="Explain DB indexing", order=0, expected_topics=None):
    m = MagicMock()
    m.id = uuid.UUID(topic_id) if topic_id else uuid.uuid4()
    m.text = text
    m.order = order
    m.expected_topics = expected_topics or []
    return m


def _make_transcript_turn(speaker="candidate", text="I used B-tree indexes.", sequence_number=1):
    m = MagicMock()
    m.speaker = speaker
    m.text = text
    m.sequence_number = sequence_number
    return m


def _make_thread_result():
    r = MagicMock()
    r.depth_under_pressure = 7.0
    r.conceptual_accuracy = 8.0
    r.specificity = 6.5
    r.recovery = 7.5
    r.overall_score = 7.4
    r.verdict = "strong"
    r.red_flags = []
    r.strong_signals = ["Mentioned B-tree internals unprompted"]
    r.suggested_followups = ["What happens during index rebuild under load?"]
    r.requires_human_review = False
    r.human_review_reason = ""
    r.turn_count = 4
    r.candidate_turn_count = 2
    r.model_used = "gemini-2.0-flash"
    r.raw_response = {}
    return r


def _make_brief_result():
    r = MagicMock()
    r.overall_signal = "strong"
    r.summary = "Candidate demonstrated genuine depth across all topics."
    r.performs_under_pressure = True
    r.specificity_consistent = True
    r.self_contradictions_detected = False
    r.contradiction_detail = ""
    r.red_flags = []
    r.strong_signals = ["Consistent use of concrete metrics"]
    r.suggested_followup_questions = ["Describe a production incident you owned end-to-end."]
    r.requires_human_review = False
    r.model_used = "gemini-2.0-flash"
    r.raw_response = {}
    return r


# ---------------------------------------------------------------------------
# evaluate_topic_thread
# ---------------------------------------------------------------------------

class TestEvaluateTopicThread:

    @patch("apps.interview.tasks.evaluation_tasks.ThreadEvaluation")
    def test_idempotency_skips_if_already_evaluated(self, mock_te):
        """If a ThreadEvaluation already exists for this topic, skip silently."""
        from apps.interview.tasks.evaluation_tasks import evaluate_topic_thread

        mock_te.objects.filter.return_value.exists.return_value = True

        task = evaluate_topic_thread  # unbound — call directly
        task.run = task  # pytest — bypass Celery machinery

        with patch("apps.interview.tasks.evaluation_tasks.logger") as mock_log:
            evaluate_topic_thread("session-1", "topic-1")

        mock_log.info.assert_called_once()
        assert "skipping" in mock_log.info.call_args[0][0]

    @patch("apps.interview.tasks.evaluation_tasks.ThreadEvaluation")
    @patch("apps.interview.tasks.evaluation_tasks.InterviewSession")
    def test_no_session_returns_early(self, mock_is, mock_te):
        mock_te.objects.filter.return_value.exists.return_value = False
        mock_is.objects.filter.return_value.first.return_value = None

        from apps.interview.tasks.evaluation_tasks import evaluate_topic_thread
        evaluate_topic_thread("missing-session", "topic-1")  # should not raise

    @patch("apps.interview.tasks.evaluation_tasks.ThreadEvaluation")
    @patch("apps.interview.tasks.evaluation_tasks.Question")
    @patch("apps.interview.tasks.evaluation_tasks.InterviewSession")
    def test_no_topic_returns_early(self, mock_is, mock_q, mock_te):
        mock_te.objects.filter.return_value.exists.return_value = False
        mock_is.objects.filter.return_value.first.return_value = _make_session()
        mock_q.objects.filter.return_value.first.return_value = None

        from apps.interview.tasks.evaluation_tasks import evaluate_topic_thread
        evaluate_topic_thread("session-1", "missing-topic")  # should not raise

    @patch("apps.interview.tasks.evaluation_tasks.ThreadEvaluation")
    @patch("apps.interview.tasks.evaluation_tasks.ConversationTurn")
    @patch("apps.interview.tasks.evaluation_tasks.Transcript")
    @patch("apps.interview.tasks.evaluation_tasks.Question")
    @patch("apps.interview.tasks.evaluation_tasks.InterviewSession")
    def test_no_turns_returns_early(self, mock_is, mock_q, mock_tr, mock_ct, mock_te):
        mock_te.objects.filter.return_value.exists.return_value = False
        mock_is.objects.filter.return_value.first.return_value = _make_session()

        topic = _make_topic()
        mock_q.objects.filter.return_value.first.return_value = topic

        # Primary lookup returns nothing; fallback also returns nothing.
        mock_tr.objects.filter.return_value.order_by.return_value = []
        mock_ct.objects.filter.return_value.order_by.return_value.first.return_value = None

        from apps.interview.tasks.evaluation_tasks import evaluate_topic_thread
        evaluate_topic_thread(str(uuid.uuid4()), str(topic.id))  # should not raise

    @patch("apps.interview.tasks.evaluation_tasks.container")
    @patch("apps.interview.tasks.evaluation_tasks.ThreadEvaluation")
    @patch("apps.interview.tasks.evaluation_tasks.ConversationTurn")
    @patch("apps.interview.tasks.evaluation_tasks.Transcript")
    @patch("apps.interview.tasks.evaluation_tasks.Question")
    @patch("apps.interview.tasks.evaluation_tasks.InterviewSession")
    def test_happy_path_saves_thread_evaluation(
        self, mock_is, mock_q, mock_tr, mock_ct, mock_te, mock_container
    ):
        session = _make_session()
        topic = _make_topic()
        turns = [
            _make_transcript_turn("assistant", "Walk me through DB indexing.", 1),
            _make_transcript_turn("candidate", "I used B-tree composite indexes.", 2),
            _make_transcript_turn("assistant", "What about index selectivity?", 3),
            _make_transcript_turn("candidate", "High-cardinality columns first.", 4),
        ]

        mock_te.objects.filter.return_value.exists.return_value = False
        mock_is.objects.filter.return_value.first.return_value = session
        mock_q.objects.filter.return_value.first.return_value = topic
        mock_tr.objects.filter.return_value.order_by.return_value = turns

        result = _make_thread_result()
        mock_container.ai_factory.return_value.thread_evaluation.return_value.evaluate_thread.return_value = result

        from apps.interview.tasks.evaluation_tasks import evaluate_topic_thread
        evaluate_topic_thread(str(session.id), str(topic.id))

        mock_te.objects.create.assert_called_once()
        call_kwargs = mock_te.objects.create.call_args[1]
        assert call_kwargs["verdict"] == "strong"
        assert call_kwargs["overall_score"] == 7.4
        assert call_kwargs["interview"] == session
        assert call_kwargs["seed_topic"] == topic

    @patch("apps.interview.tasks.evaluation_tasks.container")
    @patch("apps.interview.tasks.evaluation_tasks.ThreadEvaluation")
    @patch("apps.interview.tasks.evaluation_tasks.ConversationTurn")
    @patch("apps.interview.tasks.evaluation_tasks.Transcript")
    @patch("apps.interview.tasks.evaluation_tasks.Question")
    @patch("apps.interview.tasks.evaluation_tasks.InterviewSession")
    def test_external_service_error_retries(
        self, mock_is, mock_q, mock_tr, mock_ct, mock_te, mock_container
    ):
        from core.exceptions import ExternalServiceError
        from apps.interview.tasks.evaluation_tasks import evaluate_topic_thread

        session = _make_session()
        topic = _make_topic()
        turns = [_make_transcript_turn("candidate", "answer", 1),
                 _make_transcript_turn("assistant", "question", 2)]

        mock_te.objects.filter.return_value.exists.return_value = False
        mock_is.objects.filter.return_value.first.return_value = session
        mock_q.objects.filter.return_value.first.return_value = topic
        mock_tr.objects.filter.return_value.order_by.return_value = turns

        mock_container.ai_factory.return_value.thread_evaluation.return_value \
            .evaluate_thread.side_effect = ExternalServiceError("Gemini 503")

        # ExternalServiceError should propagate out (Celery will retry it)
        with pytest.raises(ExternalServiceError):
            evaluate_topic_thread(str(session.id), str(topic.id))

    @patch("apps.interview.tasks.evaluation_tasks.container")
    @patch("apps.interview.tasks.evaluation_tasks.ThreadEvaluation")
    @patch("apps.interview.tasks.evaluation_tasks.ConversationTurn")
    @patch("apps.interview.tasks.evaluation_tasks.Transcript")
    @patch("apps.interview.tasks.evaluation_tasks.Question")
    @patch("apps.interview.tasks.evaluation_tasks.InterviewSession")
    def test_unrecoverable_error_does_not_retry(
        self, mock_is, mock_q, mock_tr, mock_ct, mock_te, mock_container
    ):
        from apps.interview.tasks.evaluation_tasks import evaluate_topic_thread

        session = _make_session()
        topic = _make_topic()
        turns = [_make_transcript_turn("candidate", "answer", 1),
                 _make_transcript_turn("assistant", "question", 2)]

        mock_te.objects.filter.return_value.exists.return_value = False
        mock_is.objects.filter.return_value.first.return_value = session
        mock_q.objects.filter.return_value.first.return_value = topic
        mock_tr.objects.filter.return_value.order_by.return_value = turns

        mock_container.ai_factory.return_value.thread_evaluation.return_value \
            .evaluate_thread.side_effect = ValueError("Bad prompt")

        # ValueError is not ExternalServiceError — should raise immediately, not retry
        with pytest.raises(ValueError, match="Bad prompt"):
            evaluate_topic_thread(str(session.id), str(topic.id))


# ---------------------------------------------------------------------------
# generate_interview_brief
# ---------------------------------------------------------------------------

class TestGenerateInterviewBrief:

    @patch("apps.interview.tasks.evaluation_tasks.InterviewBrief")
    def test_idempotency_skips_if_brief_exists(self, mock_ib):
        mock_ib.objects.filter.return_value.exists.return_value = True

        from apps.interview.tasks.evaluation_tasks import generate_interview_brief
        generate_interview_brief(str(uuid.uuid4()))  # should not raise or create

        mock_ib.objects.create.assert_not_called()

    @patch("apps.interview.tasks.evaluation_tasks.InterviewBrief")
    @patch("apps.interview.tasks.evaluation_tasks.InterviewSession")
    def test_no_session_returns_early(self, mock_is, mock_ib):
        mock_ib.objects.filter.return_value.exists.return_value = False
        mock_is.objects.filter.return_value.first.return_value = None

        from apps.interview.tasks.evaluation_tasks import generate_interview_brief
        generate_interview_brief(str(uuid.uuid4()))

        mock_ib.objects.create.assert_not_called()

    @patch("apps.interview.tasks.evaluation_tasks.generate_interview_brief")
    @patch("apps.interview.tasks.evaluation_tasks.ThreadEvaluation")
    @patch("apps.interview.tasks.evaluation_tasks.Question")
    @patch("apps.interview.tasks.evaluation_tasks.InterviewBrief")
    @patch("apps.interview.tasks.evaluation_tasks.InterviewSession")
    def test_readiness_check_reschedules_when_pending(
        self, mock_is, mock_ib, mock_q, mock_te, mock_self_task
    ):
        """If some topics aren't evaluated yet, task reschedules itself."""
        session = _make_session()
        topic_id = uuid.uuid4()

        mock_ib.objects.filter.return_value.exists.return_value = False
        mock_is.objects.filter.return_value.first.return_value = session

        # One ASKED topic, no evaluations yet.
        mock_q.objects.filter.return_value.values_list.return_value = [topic_id]
        mock_te.objects.filter.return_value.values_list.return_value = []

        from apps.interview.tasks.evaluation_tasks import generate_interview_brief

        # _readiness_attempt=0, so it should reschedule.
        generate_interview_brief(str(session.id), _readiness_attempt=0)

        mock_self_task.apply_async.assert_called_once()
        call_kwargs = mock_self_task.apply_async.call_args[1]
        assert call_kwargs["kwargs"]["_readiness_attempt"] == 1
        assert call_kwargs["countdown"] == 30

    @patch("apps.interview.tasks.evaluation_tasks.container")
    @patch("apps.interview.tasks.evaluation_tasks.ThreadEvaluation")
    @patch("apps.interview.tasks.evaluation_tasks.Question")
    @patch("apps.interview.tasks.evaluation_tasks.InterviewBrief")
    @patch("apps.interview.tasks.evaluation_tasks.InterviewSession")
    def test_max_waits_exceeded_proceeds_on_partial_data(
        self, mock_is, mock_ib, mock_q, mock_te, mock_container
    ):
        """After _BRIEF_MAX_READINESS_WAITS attempts, brief is generated on whatever data exists."""
        session = _make_session()
        topic_id = uuid.uuid4()
        eval_topic_id = uuid.uuid4()

        mock_ib.objects.filter.return_value.exists.return_value = False
        mock_is.objects.filter.return_value.first.return_value = session

        # 2 ASKED topics, only 1 evaluated — but we've exceeded wait limit.
        mock_q.objects.filter.return_value.values_list.return_value = [topic_id, eval_topic_id]
        mock_te.objects.filter.return_value.values_list.return_value = [eval_topic_id]

        eval_obj = MagicMock()
        eval_obj.seed_topic.text = "Topic A"
        eval_obj.verdict = "strong"
        eval_obj.overall_score = 8.0
        eval_obj.depth_under_pressure = 8.0
        eval_obj.conceptual_accuracy = 8.0
        eval_obj.specificity = 8.0
        eval_obj.red_flags = []
        eval_obj.strong_signals = []
        eval_obj.suggested_followups = []

        mock_te.objects.filter.return_value.select_related.return_value.order_by.return_value = [eval_obj]

        result = _make_brief_result()
        mock_container.ai_factory.return_value.interview_brief.return_value \
            .generate_brief.return_value = result

        from apps.interview.tasks.evaluation_tasks import generate_interview_brief
        from apps.interview.tasks.evaluation_tasks import _BRIEF_MAX_READINESS_WAITS
        generate_interview_brief(str(session.id), _readiness_attempt=_BRIEF_MAX_READINESS_WAITS)

        mock_ib.objects.create.assert_called_once()

    @patch("apps.interview.tasks.evaluation_tasks.container")
    @patch("apps.interview.tasks.evaluation_tasks.ThreadEvaluation")
    @patch("apps.interview.tasks.evaluation_tasks.Question")
    @patch("apps.interview.tasks.evaluation_tasks.InterviewBrief")
    @patch("apps.interview.tasks.evaluation_tasks.InterviewSession")
    def test_no_thread_evals_skips_brief(self, mock_is, mock_ib, mock_q, mock_te, mock_container):
        session = _make_session()

        mock_ib.objects.filter.return_value.exists.return_value = False
        mock_is.objects.filter.return_value.first.return_value = session
        mock_q.objects.filter.return_value.values_list.return_value = []
        mock_te.objects.filter.return_value.values_list.return_value = []
        mock_te.objects.filter.return_value.select_related.return_value.order_by.return_value = []

        from apps.interview.tasks.evaluation_tasks import generate_interview_brief
        generate_interview_brief(str(session.id))

        mock_ib.objects.create.assert_not_called()

    @patch("apps.interview.tasks.evaluation_tasks.container")
    @patch("apps.interview.tasks.evaluation_tasks.ThreadEvaluation")
    @patch("apps.interview.tasks.evaluation_tasks.Question")
    @patch("apps.interview.tasks.evaluation_tasks.InterviewBrief")
    @patch("apps.interview.tasks.evaluation_tasks.InterviewSession")
    def test_happy_path_saves_brief(self, mock_is, mock_ib, mock_q, mock_te, mock_container):
        session = _make_session()
        topic_id = uuid.uuid4()

        mock_ib.objects.filter.return_value.exists.return_value = False
        mock_is.objects.filter.return_value.first.return_value = session

        # All topics evaluated.
        mock_q.objects.filter.return_value.values_list.return_value = [topic_id]
        mock_te.objects.filter.return_value.values_list.return_value = [topic_id]

        eval_obj = MagicMock()
        eval_obj.seed_topic.text = "Explain DB indexing"
        eval_obj.verdict = "strong"
        eval_obj.overall_score = 8.0
        eval_obj.depth_under_pressure = 8.5
        eval_obj.conceptual_accuracy = 8.0
        eval_obj.specificity = 7.5
        eval_obj.red_flags = []
        eval_obj.strong_signals = ["Mentioned B-tree internals"]
        eval_obj.suggested_followups = []

        mock_te.objects.filter.return_value.select_related.return_value.order_by.return_value = [eval_obj]

        result = _make_brief_result()
        mock_container.ai_factory.return_value.interview_brief.return_value \
            .generate_brief.return_value = result

        from apps.interview.tasks.evaluation_tasks import generate_interview_brief
        generate_interview_brief(str(session.id))

        mock_ib.objects.create.assert_called_once()
        call_kwargs = mock_ib.objects.create.call_args[1]
        assert call_kwargs["overall_signal"] == "strong"
        assert call_kwargs["interview"] == session
        assert call_kwargs["summary"] == result.summary

    @patch("apps.interview.tasks.evaluation_tasks.container")
    @patch("apps.interview.tasks.evaluation_tasks.ThreadEvaluation")
    @patch("apps.interview.tasks.evaluation_tasks.Question")
    @patch("apps.interview.tasks.evaluation_tasks.InterviewBrief")
    @patch("apps.interview.tasks.evaluation_tasks.InterviewSession")
    def test_external_service_error_retries(
        self, mock_is, mock_ib, mock_q, mock_te, mock_container
    ):
        from core.exceptions import ExternalServiceError
        from apps.interview.tasks.evaluation_tasks import generate_interview_brief

        session = _make_session()
        topic_id = uuid.uuid4()

        mock_ib.objects.filter.return_value.exists.return_value = False
        mock_is.objects.filter.return_value.first.return_value = session
        mock_q.objects.filter.return_value.values_list.return_value = [topic_id]
        mock_te.objects.filter.return_value.values_list.return_value = [topic_id]

        eval_obj = MagicMock()
        eval_obj.seed_topic.text = "Topic"
        eval_obj.verdict = "strong"
        eval_obj.overall_score = 8.0
        eval_obj.depth_under_pressure = 8.0
        eval_obj.conceptual_accuracy = 8.0
        eval_obj.specificity = 8.0
        eval_obj.red_flags = []
        eval_obj.strong_signals = []
        eval_obj.suggested_followups = []

        mock_te.objects.filter.return_value.select_related.return_value.order_by.return_value = [eval_obj]
        mock_container.ai_factory.return_value.interview_brief.return_value \
            .generate_brief.side_effect = ExternalServiceError("Gemini 503")

        # ExternalServiceError should propagate out (Celery will retry it)
        with pytest.raises(ExternalServiceError):
            generate_interview_brief(str(session.id))