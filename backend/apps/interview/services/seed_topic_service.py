"""
SeedTopicService: generates resume-aware seed topics for a realtime
interview session and bulk-creates them as Question rows (status=PENDING).

Called as a Celery task after session creation so the HTTP response to
the frontend is immediate. By the time the candidate clicks "Start
Interview", the seed topics are already in the DB and
InterviewOrchestrator can drip-feed them via ask_next_question without
any LLM call at call-start time.

Flow:
    POST /realtime/sessions/create/
        → create InterviewSession (SCHEDULED, seed_topics_ready=False)
        → return 201 immediately
        → [Celery] generate_seed_topics_task.delay(session_id)
            → SeedTopicService.generate_and_store(session)
                → load resume from session
                → call ISeedTopicGenerationProvider.generate_seed_topics(...)
                → bulk_create Question rows (status=PENDING)
                → session.seed_topics_ready = True
    POST /realtime/sessions/<id>/start/
        → InterviewOrchestrator.start_realtime_session(session)
            → seed topics already in DB, no LLM call needed
"""
import logging

from django.db import transaction

from apps.ai.providers.llm.interfaces import ISeedTopicGenerationProvider
from apps.interview.models import InterviewSession, Question
from core.exceptions import ExternalServiceError
from core.services import BaseService

logger = logging.getLogger("smarthire")

# Default number of seed topics if not overridden per session
_DEFAULT_TOPIC_COUNT = 6
# Interview duration estimate used in the prompt (we don't store this yet,
# so we derive it from topic count: ~5 min per topic)
_MINUTES_PER_TOPIC = 5


class SeedTopicService(BaseService):
    """
    Generates resume-aware seed topics and persists them as Question rows.
    Injected with an ISeedTopicGenerationProvider (Gemini in prod, mock in dev/test).
    """

    def __init__(self, provider: ISeedTopicGenerationProvider):
        super().__init__()
        self._provider = provider

    @transaction.atomic
    def generate_and_store(self, *, session: InterviewSession, topic_count: int | None = None) -> list[Question]:
        """
        Main entry point (called by the Celery task).

        1. Loads resume data from the session (already extracted).
        2. Calls the LLM provider to produce resume-grounded directives.
        3. Bulk-creates Question rows linked to the session (status=PENDING).
        4. Marks session.seed_topics_ready = True.

        Idempotent: if seed topics already exist for this session, skips
        generation and returns the existing topics (safe for Celery retries).
        """
        existing = list(session.seed_topics.order_by("order"))  # type: ignore[attr-defined]
        if existing:
            logger.info(
                "SeedTopicService: session %s already has %d seed topics — skipping generation",
                session.id, len(existing),
            )
            return existing

        resume = session.resume
        if resume is None:
            logger.warning(
                "SeedTopicService: session %s has no resume — generating generic seed topics",
                session.id,
            )
            skills: list[str] = []
            technologies: list[str] = []
            experience_years: float = 0.0
            experience: list[dict] = []
            projects: list[dict] = []
            education: list[dict] = []
            resume_summary: str = ""
        else:
            skills = list(resume.skills or [])
            technologies = list(resume.technologies or [])
            experience_years = float(resume.experience_years or 0.0)
            experience = list(resume.experience or [])
            projects = list(resume.projects or [])
            education = list(resume.education or [])
            resume_summary = resume.summary or ""

        count = topic_count or _DEFAULT_TOPIC_COUNT
        duration_minutes = count * _MINUTES_PER_TOPIC

        generated = self._provider.generate_seed_topics(
            interview_type=session.interview_type,
            domain=session.domain,
            difficulty=session.difficulty,
            duration_minutes=duration_minutes,
            count=count,
            resume_summary=resume_summary,
            experience_years=experience_years,
            skills=skills,
            technologies=technologies,
            experience=experience,
            projects=projects,
            education=education,
        )

        questions = [
            Question(
                session=session,
                template=session.template,
                text=topic.text,
                category=topic.category,
                difficulty=topic.difficulty,
                expected_topics=topic.expected_topics,
                order=topic.order,
                is_ai_generated=True,
                status=Question.Status.PENDING,
            )
            for topic in generated
        ]
        created = Question.objects.bulk_create(questions)

        # Mark session ready so the frontend / start view can check
        InterviewSession.objects.filter(pk=session.pk).update(seed_topics_ready=True)
        session.seed_topics_ready = True  # update in-memory copy too

        logger.info(
            "SeedTopicService: created %d seed topics for session %s",
            len(created), session.id,
        )
        return created