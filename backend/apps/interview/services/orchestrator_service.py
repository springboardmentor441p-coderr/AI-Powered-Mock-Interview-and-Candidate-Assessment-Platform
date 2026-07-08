"""
InterviewOrchestrator: replaces the old "generate all questions up
front, then collect answers one submit at a time" flow with a live
conversation.

Three things drive it, matching Ultravox's actual integration model
(see `ai/providers/realtime_voice/ultravox_provider.py` for why this
isn't a single generic webhook):

  * `start_realtime_session`  - called once, from the "Start Interview"
    button. Creates the call and returns a join URL for the frontend.
  * `handle_tool_call`        - called by Ultravox mid-call, every time
    the model decides it's time to move to a new topic. This is what
    makes the interview adaptive instead of scripted.
  * `handle_lifecycle_event`  - called for account-level call.started /
    call.joined / call.ended webhooks. `call.ended` is what completes
    the session and queues the existing assessment pipeline.
  * `record_transcript_turn`  - called by the frontend as it observes
    finalized turns via the Ultravox client SDK (and, separately, when
    it detects the candidate barged in in the middle of the AI
    speaking - `was_interrupted=True`).
"""
from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from core.exceptions import BusinessRuleViolation, NotFoundError
from core.services import BaseService

from apps.ai.providers.realtime_voice.interfaces import IRealtimeVoiceProvider
from apps.interview.models import ConversationTurn, InterviewSession, Question, RealtimeEventLog

# Built-in Ultravox tool - lets the model end the call itself once the
# interview is naturally wrapping up, instead of us guessing when to hang up.
_HANG_UP_TOOL = {"toolName": "hangUp"}


def _ask_next_question_tool(webhook_url: str, tool_secret: str) -> dict:
    """
    Custom HTTP tool: the model calls this whenever it wants to move to
    a new topic. Our handler picks the next unused seed topic (if any)
    and returns instructions the model should say next, which keeps
    the conversation grounded in the candidate's actual resume/domain
    instead of drifting.
    """
    return {
        "temporaryTool": {
            "modelToolName": "ask_next_question",
            "description": (
                "Call this when you're ready to move the interview to a new topic - "
                "after the candidate has finished answering and you don't have a natural "
                "follow-up left to ask. Do not call this mid-answer or while the candidate "
                "is still speaking."
            ),
            "dynamicParameters": [
                {
                    "name": "previous_topic_covered",
                    "location": "PARAMETER_LOCATION_BODY",
                    "schema": {"type": "string", "description": "Brief note on what was just covered."},
                    "required": False,
                }
            ],
            "http": {"baseUrlPattern": webhook_url, "httpMethod": "POST"},
        }
    }


class InterviewOrchestrator(BaseService):
    def __init__(self, realtime_provider: IRealtimeVoiceProvider):
        super().__init__()
        self._provider = realtime_provider

    # ------------------------------------------------------------------
    # Call setup
    # ------------------------------------------------------------------

    @transaction.atomic
    def start_realtime_session(self, *, session: InterviewSession) -> InterviewSession:
        if session.mode != InterviewSession.Mode.REALTIME:
            raise BusinessRuleViolation("This session was not created in realtime mode.")
        if session.status != InterviewSession.Status.SCHEDULED:
            raise BusinessRuleViolation(f"Cannot start a call for a session in status '{session.status}'.")
        if not session.seed_topics_ready:
            raise BusinessRuleViolation(
                "Seed topics are still being generated. "
                "Please wait a moment and try again — this usually takes under 10 seconds."
            )

        base_url = settings.BACKEND_PUBLIC_URL.rstrip("/")
        tool_webhook_url = f"{base_url}/api/interview/realtime/sessions/{session.id}/tools/ask-next-question/"
        tool_secret = settings.ULTRAVOX_TOOL_SHARED_SECRET

        handle = self._provider.create_call(
            system_prompt=self._build_system_prompt(session),
            first_message=self._opening_line(session),
            tools=[_ask_next_question_tool(tool_webhook_url, tool_secret), _HANG_UP_TOOL],
            webhook_url=f"{base_url}/api/interview/realtime/webhooks/ultravox/",
            metadata={"session_id": str(session.id), "tool_secret": tool_secret},
        )

        session.status = InterviewSession.Status.IN_PROGRESS
        session.started_at = timezone.now()
        session.call_id = handle.call_id
        session.call_join_url = handle.join_url
        session.realtime_provider = handle.provider
        session.save(
            update_fields=["status", "started_at", "call_id", "call_join_url", "realtime_provider"]
        )
        self.logger.info("Started realtime call %s for session %s", handle.call_id, session.id)
        return session

    # ------------------------------------------------------------------
    # Mid-call tool calls
    # ------------------------------------------------------------------

    @transaction.atomic
    def handle_ask_next_question(self, *, session: InterviewSession, arguments: dict) -> str:
        """
        Returns the instruction text Ultravox should speak/act on next.
        Marks the previously-asked seed topic covered and hands back
        the next one, if any are left; otherwise tells the model to
        wrap up naturally.
        """
        if arguments.get("previous_topic_covered"):
            asked = session.seed_topics.filter(status=Question.Status.ASKED).order_by("-order").first()  # type: ignore[attr-defined]
            if asked:
                RealtimeEventLog.objects.create(
                    session=session, provider=session.realtime_provider or "ultravox",
                    event_type="topic_note", payload={"note": arguments["previous_topic_covered"]},
                )

        next_topic = session.seed_topics.filter(status=Question.Status.PENDING).order_by("order").first()  # type: ignore[attr-defined]
        if next_topic is None:
            return (
                "All planned topics have been covered. Wrap up warmly: ask if the "
                "candidate has any questions for you, thank them, then use the hangUp tool."
            )

        next_topic.status = Question.Status.ASKED
        next_topic.save(update_fields=["status"])

        ConversationTurn.objects.create(
            session=session, speaker=ConversationTurn.Speaker.AI, turn_type=ConversationTurn.TurnType.QUESTION,
            text=next_topic.text, seed_topic=next_topic, order=session.turns.count(),  # type: ignore[attr-defined]
        )

        # Build the instruction Ultravox will act on. Include what concepts
        # a good answer should cover so the AI knows when to probe deeper
        # vs when to accept the answer and move on.
        instruction = f"Ask the candidate, in your own natural words: {next_topic.text}"
        if next_topic.expected_topics:
            concepts = ", ".join(next_topic.expected_topics)
            instruction += (
                f"\n\nA strong answer should cover: {concepts}. "
                "If the candidate's answer is vague or skips key concepts, "
                "ask a targeted follow-up before calling ask_next_question again."
            )
        return instruction

    # ------------------------------------------------------------------
    # Account-level lifecycle webhooks (call.started / call.joined / call.ended)
    # ------------------------------------------------------------------

    @transaction.atomic
    def handle_lifecycle_event(self, *, session: InterviewSession, event_type: str, raw_payload: dict) -> None:
        RealtimeEventLog.objects.create(
            session=session, provider=session.realtime_provider or "ultravox",
            event_type=event_type, payload=raw_payload,
        )
        if event_type == "call_ended":
            self._complete_session(session)

    def _complete_session(self, session: InterviewSession) -> None:
        if session.status != InterviewSession.Status.IN_PROGRESS:
            return
        session.status = InterviewSession.Status.COMPLETED
        completed_at = timezone.now()
        session.completed_at = completed_at
        started_at = session.started_at
        if started_at and completed_at:
            session.duration_seconds = int((completed_at - started_at).total_seconds())
        session.save(update_fields=["status", "completed_at", "duration_seconds"])

        from apps.assessment.tasks.scoring_tasks import run_assessment_pipeline

        run_assessment_pipeline.delay(str(session.id))  # type: ignore[union-attr]
        self.logger.info("Realtime session %s completed; assessment pipeline queued.", session.id)

    # ------------------------------------------------------------------
    # Frontend-reported transcript turns (captured via the Ultravox client SDK)
    # ------------------------------------------------------------------

    @transaction.atomic
    def record_transcript_turn(
        self, *, session: InterviewSession, speaker: str, text: str,
        turn_type: str = ConversationTurn.TurnType.ANSWER,
        started_at_ms: int | None = None, ended_at_ms: int | None = None,
        was_interrupted: bool = False,
    ) -> ConversationTurn:
        if session.status != InterviewSession.Status.IN_PROGRESS:
            raise BusinessRuleViolation("Cannot record a transcript turn for a session that is not in progress.")

        turn = ConversationTurn.objects.create(
            session=session, speaker=speaker, turn_type=turn_type, text=text,
            order=session.turns.count(), started_at_ms=started_at_ms, ended_at_ms=ended_at_ms,  # type: ignore[attr-defined]
            was_interrupted=was_interrupted,
        )
        if was_interrupted:
            session.interrupt_count = F("interrupt_count") + 1
            session.save(update_fields=["interrupt_count"])
            last_ai_turn = (
                session.turns.filter(speaker=ConversationTurn.Speaker.AI).exclude(pk=turn.pk).order_by("-order").first()  # type: ignore[attr-defined]
            )
            if last_ai_turn:
                last_ai_turn.was_interrupted = True
                last_ai_turn.save(update_fields=["was_interrupted"])
        return turn

    # ------------------------------------------------------------------
    # Prompt construction
    # ------------------------------------------------------------------

    def _build_system_prompt(self, session: InterviewSession) -> str:
        resume = session.resume
        skills = ", ".join(resume.skills) if resume and resume.skills else "not specified"

        # Experience block
        experience_lines = []
        if resume and resume.experience:
            for exp in resume.experience:
                line = f"  - {exp.get('title', '')} at {exp.get('company', '')} ({exp.get('duration', '')}): {exp.get('description', '')}"
                experience_lines.append(line)
        experience_block = "\n".join(experience_lines) if experience_lines else "  - not specified"

        # Projects block
        project_lines = []
        if resume and resume.projects:
            for proj in resume.projects:
                techs = ", ".join(proj.get("technologies") or [])
                line = f"  - {proj.get('name', '')}: {proj.get('description', '')} [Tech: {techs}]"
                project_lines.append(line)
        projects_block = "\n".join(project_lines) if project_lines else "  - not specified"

        topics = list(session.seed_topics.order_by("order").values_list("text", flat=True))  # type: ignore[attr-defined]
        topics_block = "\n".join(f"- {t}" for t in topics) if topics else "- (no seed topics; improvise based on the candidate's background)"

        return f"""You are conducting a live, spoken {session.interview_type} interview for a {session.domain} \
            role at {session.difficulty} difficulty. You are talking, not typing - keep turns short, natural, and \
            conversational, like a real human interviewer on a call.

            Candidate background/skills from their resume: {skills}

            Work experience:
            {experience_block}

            Projects:
            {projects_block}

            Suggested talking points to draw from (not a rigid script - ask about them in your own words, in \
            whatever order fits the conversation, and skip ones the candidate has already addressed):
            {topics_block}

            Rules:
            - Ask ONE question at a time. Never stack multiple questions in one turn.
            - If the candidate starts speaking while you're talking, stop immediately and listen - do not \
            finish your sentence. Respond to what they actually said.
            - Ask natural, specific follow-up questions based on their answers before moving on - don't just \
            march down a checklist.
            - When you're out of natural follow-ups on the current topic, call the ask_next_question tool to \
            get the next topic; don't invent a topic switch yourself.
            - Keep a warm, encouraging, professional tone throughout.
            - When ask_next_question tells you all topics are covered, thank the candidate, ask if they have \
            any questions for you, and then call the hangUp tool to end the interview."""

    def _opening_line(self, session: InterviewSession) -> str:
        return (
            f"Hi! Thanks for joining. I'll be your interviewer today for this {session.difficulty} "
            f"{session.interview_type} interview. To start, could you briefly introduce yourself and "
            f"walk me through your background?"
        )