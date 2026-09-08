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

    Receives one finalized transcript turn from the frontend relay or webhook.
    Authenticated by either:
      1. X-Tool-Secret shared header, OR
      2. Authenticated candidate who owns the session.
    Throttling disabled: the authentication is the rate-control mechanism.
    """
    permission_classes = [AllowAny]
    throttle_classes: list[type[BaseThrottle]] = []

    def post(self, request: Request, session_id: str, *args: Any, **kwargs: Any):
        from core.container import container
        from apps.interview.models import ConversationTurn

        provided_secret = request.headers.get("X-Tool-Secret", "")
        is_secret_valid = bool(settings.ULTRAVOX_TOOL_SHARED_SECRET and provided_secret == settings.ULTRAVOX_TOOL_SHARED_SECRET)
        is_candidate_auth = bool(request.user and request.user.is_authenticated and request.user.role == "candidate")

        if not (is_secret_valid or is_candidate_auth):
            return APIResponse.error(
                message="Invalid webhook credentials.",
                http_status=status.HTTP_401_UNAUTHORIZED,
            )

        session = get_object_or_404(InterviewSession, pk=session_id)
        if is_candidate_auth and not is_secret_valid and session.candidate_id != request.user.id:
            return APIResponse.error(
                message="Permission denied.",
                http_status=status.HTTP_403_FORBIDDEN,
            )

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
        if vd.get("question_id"):
            q = Question.objects.filter(pk=vd["question_id"], session=session).first()
            if q:
                return q
        return session.current_seed_topic


class SessionTranscriptListView(APIView):
    """
    GET /api/v1/interviews/realtime/sessions/<id>/transcript/full/
    Full ordered transcript for replay/review UI. Accessible by candidate owner or recruiter.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, session_id: str, *args: Any, **kwargs: Any):
        from core.container import container

        session = get_object_or_404(InterviewSession.objects.select_related("candidate"), pk=session_id)
        user = request.user
        if session.candidate_id != user.id and user.role not in ("recruiter", "admin"):
            return APIResponse.error(message="Access denied.", http_status=status.HTTP_403_FORBIDDEN)

        turns = container.transcript_service().get_ordered_turns(session)
        return APIResponse.success(data=TranscriptSerializer(turns, many=True).data)


class SessionThreadEvaluationListView(APIView):
    """
    GET /api/v1/interviews/realtime/sessions/<id>/thread-evaluations/
    Per-topic thread evaluation scores. Accessible by candidate owner or recruiter.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, session_id: str, *args: Any, **kwargs: Any):
        session = get_object_or_404(InterviewSession.objects.select_related("candidate"), pk=session_id)
        user = request.user
        if session.candidate_id != user.id and user.role not in ("recruiter", "admin"):
            return APIResponse.error(message="Access denied.", http_status=status.HTTP_403_FORBIDDEN)

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
        return get_object_or_404(
            InterviewBrief.objects.select_related("interview", "interview__candidate"),
            interview_id=session_id,
        )

    def get(self, request: Request, session_id: str, *args: Any, **kwargs: Any):
        brief = self._get_brief(session_id)
        user = request.user
        is_candidate_owner = (brief.interview.candidate_id == user.id)
        is_recruiter = (user.role in ("recruiter", "admin"))

        if not (is_candidate_owner or is_recruiter):
            return APIResponse.error(
                message="You do not have permission to view this interview brief.",
                http_status=status.HTTP_403_FORBIDDEN,
            )

        return APIResponse.success(data=InterviewBriefSerializer(brief).data)

    def patch(self, request: Request, session_id: str, *args: Any, **kwargs: Any):
        brief = self._get_brief(session_id)
        user = request.user
        if user.role not in ("recruiter", "admin"):
            return APIResponse.error(
                message="Only recruiters and administrators can submit hiring verdicts.",
                http_status=status.HTTP_403_FORBIDDEN,
            )

        serializer = HumanVerdictSerializer(brief, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(reviewed_by=request.user, reviewed_at=timezone.now())
        return APIResponse.success(data=InterviewBriefSerializer(brief).data)