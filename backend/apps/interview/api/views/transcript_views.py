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

        # The Ultravox webhook payload has no notion of our seed-topic
        # model — Ultravox only ever emits raw speech turns — so
        # question_id is never actually sent by the client despite being
        # accepted in the payload. Derive it ourselves: whichever seed
        # topic currently has status=ASKED is, by construction, the one
        # being discussed right now (there is exactly one at a time; see
        # InterviewOrchestrator.handle_ask_next_question).
        question = None
        if vd.get("question_id"):
            question = Question.objects.filter(pk=vd["question_id"], session=session).first()
        if question is None:
            question = (
                Question.objects
                .filter(session=session, status=Question.Status.ASKED)
                .order_by("-order")
                .first()
            )

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