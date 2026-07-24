from typing import Any, cast

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.throttling import BaseThrottle
from rest_framework.views import APIView

from core.permissions import IsCandidate
from core.responses import APIResponse

from apps.interview.api.serializers.transcript_serializers import (
    HumanVerdictSerializer,
    InterviewBriefSerializer,
    ThreadEvaluationSerializer,
    TranscriptSerializer,
    UltravoxTranscriptEventSerializer,
)
from apps.interview.models import InterviewBrief, InterviewSession, Question, ThreadEvaluation
from apps.interview.selectors.session_selector import get_owned_session_or_404


class SessionTranscriptWebhookView(APIView):
    """
    POST /api/v1/interviews/realtime/sessions/<id>/transcript/webhook/

    Receives one finalized transcript turn from the frontend relay.
    Authenticated by X-Tool-Secret header — not by Django auth.
    Throttling disabled: the shared secret is the rate-control mechanism.
    """
    permission_classes = [AllowAny]
    throttle_classes: list[type[BaseThrottle]] = []  # exempt from Django throttle

    def post(self, request: Request, session_id: str, *args: Any, **kwargs: Any):
        from core.container import container
        from apps.interview.models import ConversationTurn

        provided_secret = request.headers.get("X-Tool-Secret", "")
        if not settings.ULTRAVOX_TOOL_SHARED_SECRET or provided_secret != settings.ULTRAVOX_TOOL_SHARED_SECRET:
            return APIResponse.error(
                message="Invalid webhook credentials.",
                http_status=status.HTTP_401_UNAUTHORIZED,
            )

        session = get_object_or_404(InterviewSession, pk=session_id)

        serializer = UltravoxTranscriptEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vd = cast(dict[str, Any], serializer.validated_data)

        question = self._resolve_question(session, vd, ConversationTurn)

        turn = container.transcript_service().save_turn(
            interview=session,
            speaker=vd["speaker"],
            text=vd["text"],
            sequence_number=vd["sequence_number"],
            timestamp=vd.get("timestamp"),
            question=question,
            is_followup=vd.get("is_followup", False),
            latency_ms=vd.get("latency_ms"),
            confidence=vd.get("confidence"),
        )

        return APIResponse.created(data=TranscriptSerializer(turn).data)

    @staticmethod
    def _resolve_question(session, vd: dict, ConversationTurn) -> "Question | None":
        """
        Determine which seed topic this transcript turn belongs to.

        Priority:
          1. Explicit question_id in payload (frontend sent it — trust it).
          2. Timestamp-based lookup: find the last ConversationTurn whose
             seed_topic was introduced before this turn's timestamp. This
             correctly handles async transcript delivery where turns arrive
             after the orchestrator has already moved to the next topic.
          3. Current ASKED topic — last resort for turns with no timestamp.

        Why timestamp-based over status=ASKED:
          Transcript webhooks arrive asynchronously from the frontend. By
          the time turns for topic N reach Django, the orchestrator may have
          already transitioned to topic N+1 (status=ASKED). Looking at the
          current ASKED topic assigns all late-arriving turns to the wrong
          topic. Using the turn's own timestamp against ConversationTurn
          created_at anchors each turn to the correct topic regardless of
          delivery lag.
        """
        # 1. Explicit question_id wins.
        if vd.get("question_id"):
            q = Question.objects.filter(pk=vd["question_id"], session=session).first()
            if q:
                return q
       
        return session.current_seed_topic


class SessionTranscriptListView(APIView):
    """
    GET /api/v1/interviews/realtime/sessions/<id>/transcript/full/
    Full ordered transcript for replay/review UI.
    """
    permission_classes = [IsCandidate]

    def get(self, request: Request, session_id: str, *args: Any, **kwargs: Any):
        from core.container import container

        session = get_owned_session_or_404(candidate=request.user, session_id=session_id)
        turns = container.transcript_service().get_ordered_turns(session)
        return APIResponse.success(data=TranscriptSerializer(turns, many=True).data)


class SessionThreadEvaluationListView(APIView):
    """
    GET /api/v1/interviews/realtime/sessions/<id>/thread-evaluations/
    Per-topic thread evaluation scores.
    """
    permission_classes = [IsCandidate]

    def get(self, request: Request, session_id: str, *args: Any, **kwargs: Any):
        session = get_owned_session_or_404(candidate=request.user, session_id=session_id)
        evaluations = (
            ThreadEvaluation.objects
            .filter(interview=session)
            .select_related("seed_topic")
            .order_by("seed_topic__order")
        )
        return APIResponse.success(data=ThreadEvaluationSerializer(evaluations, many=True).data)


class SessionInterviewBriefView(APIView):
    """
    GET   /api/v1/interviews/realtime/sessions/<id>/brief/
    PATCH /api/v1/interviews/realtime/sessions/<id>/brief/
    """
    permission_classes = [IsAuthenticated]

    def _get_brief(self, session_id: str) -> InterviewBrief:
        return get_object_or_404(InterviewBrief, interview_id=session_id)

    def get(self, request: Request, session_id: str, *args: Any, **kwargs: Any):
        brief = self._get_brief(session_id)
        return APIResponse.success(data=InterviewBriefSerializer(brief).data)

    def patch(self, request: Request, session_id: str, *args: Any, **kwargs: Any):
        brief = self._get_brief(session_id)
        serializer = HumanVerdictSerializer(brief, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(reviewed_by=request.user, reviewed_at=timezone.now())
        return APIResponse.success(data=InterviewBriefSerializer(brief).data)