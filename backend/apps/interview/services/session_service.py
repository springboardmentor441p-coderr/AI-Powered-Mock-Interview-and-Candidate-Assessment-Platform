from django.db import transaction
from django.utils import timezone

from apps.ai.providers.llm.interfaces import IQuestionGenerationProvider
from core.exceptions import BusinessRuleViolation, NotFoundError, ValidationError
from core.services import BaseService

from apps.interview.models import Answer, InterviewSession, InterviewType, Question


class SessionService(BaseService):
    """
    Session lifecycle: create -> start -> answer -> complete/abandon.
    Depends on `IQuestionGenerationProvider` (injected by the container).
    """

    def __init__(self, question_provider: IQuestionGenerationProvider):
        super().__init__()
        self._question_provider = question_provider

    @transaction.atomic
    def create_session(self, *, candidate, interview_type: str, domain: str, difficulty: str,
                       question_count: int = 5, template=None, resume=None) -> InterviewSession:
        candidate_skills = list(resume.skills) if resume and resume.skills else []

        session = InterviewSession.objects.create(
            candidate=candidate, template=template, resume=resume,
            interview_type=interview_type, domain=domain, difficulty=difficulty,
            status=InterviewSession.Status.SCHEDULED,
        )

        generated = self._question_provider.generate_questions(
            interview_type=interview_type, domain=domain, difficulty=difficulty,
            count=question_count, candidate_skills=candidate_skills,
        )

        for i, gq in enumerate(generated):
            question = Question.objects.create(
                template=template, text=gq.text, category=gq.category,
                difficulty=gq.difficulty, expected_topics=gq.expected_topics,
                order=i, is_ai_generated=True,
            )
            Answer.objects.create(session=session, question=question, question_text=gq.text, order=i)

        self.logger.info("Created session %s with %d questions", session.id, len(generated))
        return session

    @transaction.atomic
    def create_realtime_session(self, *, candidate, interview_type: str, domain: str, difficulty: str,
                                topic_count: int = 6, template=None, resume=None) -> InterviewSession:
        """
        Realtime counterpart to `create_session`. Generates the same
        candidate-aware topics via `IQuestionGenerationProvider`, but
        stores them as a *seed topic pool* on the session (status
        PENDING) instead of pre-creating Answer rows for a fixed
        turn-by-turn script. `InterviewOrchestrator` pulls from this
        pool live, via the `ask_next_question` tool, as the
        conversation actually unfolds.
        """
        candidate_skills = list(resume.skills) if resume and resume.skills else []

        session = InterviewSession.objects.create(
            candidate=candidate, template=template, resume=resume,
            interview_type=interview_type, domain=domain, difficulty=difficulty,
            mode=InterviewSession.Mode.REALTIME, status=InterviewSession.Status.SCHEDULED,
        )

        generated = self._question_provider.generate_questions(
            interview_type=interview_type, domain=domain, difficulty=difficulty,
            count=topic_count, candidate_skills=candidate_skills,
        )
        for i, gq in enumerate(generated):
            Question.objects.create(
                session=session, template=template, text=gq.text, category=gq.category,
                difficulty=gq.difficulty, expected_topics=gq.expected_topics,
                order=i, is_ai_generated=True, status=Question.Status.PENDING,
            )

        self.logger.info("Created realtime session %s with %d seed topics", session.id, len(generated))
        return session

    def start_session(self, *, session: InterviewSession) -> InterviewSession:
        if session.status != InterviewSession.Status.SCHEDULED:
            raise BusinessRuleViolation(f"Cannot start a session in status '{session.status}'.")
        session.status = InterviewSession.Status.IN_PROGRESS
        session.started_at = timezone.now()
        session.save(update_fields=["status", "started_at"])
        return session

    @transaction.atomic
    def submit_answer(self, *, session: InterviewSession, question_order: int, answer_text: str = "",
                      answer_audio=None, answer_video=None, response_time_seconds: float | None = None) -> Answer:
        if session.status != InterviewSession.Status.IN_PROGRESS:
            raise BusinessRuleViolation("Cannot submit an answer to a session that is not in progress.")
        answer = session.answers.filter(order=question_order).first()  # type: ignore[attr-defined]
        if answer is None:
            raise NotFoundError(f"No question with order={question_order} in this session.")
        answer.answer_text = answer_text
        if answer_audio is not None:
            answer.answer_audio = answer_audio
        if answer_video is not None:
            answer.answer_video = answer_video
        answer.response_time_seconds = response_time_seconds
        answer.answered_at = timezone.now()
        answer.save()
        return answer

    @transaction.atomic
    def complete_session(self, *, session: InterviewSession) -> InterviewSession:
        if session.status == InterviewSession.Status.COMPLETED:
            return session
        if session.status not in (InterviewSession.Status.IN_PROGRESS, InterviewSession.Status.SCHEDULED):
            raise BusinessRuleViolation(f"Cannot complete a session in status '{session.status}'.")
        if session.mode == InterviewSession.Mode.SCRIPTED and session.answers.filter(answered_at__isnull=False).count() == 0:  # type: ignore[attr-defined]
            raise ValidationError("Cannot complete a session with no answered questions.")
        session.status = InterviewSession.Status.COMPLETED
        completed_at = timezone.now()
        session.completed_at = completed_at
        started_at = session.started_at
        if started_at and completed_at:
            session.duration_seconds = int((completed_at - started_at).total_seconds())
        session.save(update_fields=["status", "completed_at", "duration_seconds"])
        return session

    def abandon_session(self, *, session: InterviewSession) -> InterviewSession:
        if session.status == InterviewSession.Status.COMPLETED:
            raise BusinessRuleViolation("Cannot abandon a completed session.")
        session.status = InterviewSession.Status.ABANDONED
        session.save(update_fields=["status"])
        return session
