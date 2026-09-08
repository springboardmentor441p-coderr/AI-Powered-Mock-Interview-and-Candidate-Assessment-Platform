import json
from typing import Any, cast
import uuid

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.views import APIView

from core.permissions import IsCandidate
from core.responses import APIResponse

from apps.interview.api.serializers.interview_serializer import (
    CreateRealtimeSessionSerializer,
    RealtimeSessionDetailSerializer,
)
from apps.interview.models import InterviewSession, InterviewTemplate
from apps.interview.selectors.session_selector import get_owned_session_or_404


class SessionRealtimeCreateView(APIView):
    permission_classes = [IsCandidate]

    def post(self, request: Request, *args: Any, **kwargs: Any):
        from core.container import container
        from apps.resume.selectors.resume_selector import get_primary_processed_resume
        from apps.interview.tasks import generate_seed_topics_task

        serializer = CreateRealtimeSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = cast(dict[str, Any], serializer.validated_data)

        template = None
        if data.get("template_id"):
            template = InterviewTemplate.objects.filter(pk=data["template_id"], is_active=True).first()

        resume = None
        if data.get("use_primary_resume", True):
            try:
                resume = get_primary_processed_resume(candidate=request.user)
            except Exception:  # noqa: BLE001
                pass

        session = container.session_service().create_realtime_session(
            candidate=request.user,
            interview_type=data["interview_type"],
            domain=data["domain"],
            difficulty=data["difficulty"],
            topic_count=0,
            template=template,
            resume=resume,
        )

        topic_count = data.get("topic_count", 6)
        generate_seed_topics_task.delay(str(session.id), topic_count)  # type: ignore[union-attr]

        return APIResponse.created(data=RealtimeSessionDetailSerializer(session).data)


class SessionRealtimeStartView(APIView):
    permission_classes = [IsCandidate]

    def post(self, request: Request, session_id: str, *args: Any, **kwargs: Any):
        from core.container import container

        session = get_owned_session_or_404(candidate=request.user, session_id=session_id)
        session = container.interview_orchestrator().start_realtime_session(session=session)
        return APIResponse.success(data=RealtimeSessionDetailSerializer(session).data)


class SessionRealtimeHeartbeatView(APIView):
    """
    POST /api/v1/interviews/realtime/sessions/<session_id>/heartbeat/
    Liveness probe sent by frontend every 10–15s during active call.
    Updates last_seen_at and recovers CONNECTION_LOST sessions.
    """
    permission_classes = [IsCandidate]

    def post(self, request: Request, session_id: str, *args: Any, **kwargs: Any):
        from django.utils import timezone

        session = get_owned_session_or_404(candidate=request.user, session_id=session_id)
        now = timezone.now()
        client_session_id = request.data.get("client_session_id")

        update_fields = ["last_seen_at", "updated_at"]
        session.last_seen_at = now

        if client_session_id and not session.client_session_id:
            try:
                session.client_session_id = uuid.UUID(str(client_session_id))
                update_fields.append("client_session_id")
            except (ValueError, TypeError, AttributeError):
                pass

        # Auto-recover if temporary connection drop occurred
        if session.status == InterviewSession.Status.CONNECTION_LOST:
            session.status = InterviewSession.Status.IN_PROGRESS
            update_fields.append("status")

        session.save(update_fields=update_fields)

        return APIResponse.success(
            data={
                "session_id": str(session.id),
                "status": session.status,
                "last_seen_at": session.last_seen_at,
            },
            message="Heartbeat recorded.",
        )


class SessionRealtimeAbandonView(APIView):
    """
    POST /api/v1/interviews/realtime/sessions/<session_id>/abandon/
    Explicitly abandons a session (e.g. candidate clicks 'Leave Interview' and confirms).
    Preserves audit trails without wiping relational links.
    """
    permission_classes = [IsCandidate]

    def post(self, request: Request, session_id: str, *args: Any, **kwargs: Any):
        from apps.interview.models import InvitationStatus

        session = get_owned_session_or_404(candidate=request.user, session_id=session_id)

        if session.status == InterviewSession.Status.COMPLETED:
            return APIResponse.error(
                message="Cannot abandon a completed session.",
                http_status=status.HTTP_409_CONFLICT,
            )

        if session.status != InterviewSession.Status.ABANDONED:
            session.status = InterviewSession.Status.ABANDONED
            session.save(update_fields=["status", "updated_at"])

        # Update linked invitation status without wiping session foreign key
        try:
            inv = session.invitation  # type: ignore[attr-defined]
            if inv is not None and inv.status == InvitationStatus.ACCEPTED:
                inv.status = InvitationStatus.ABANDONED
                inv.save(update_fields=["status", "updated_at"])
        except Exception:  # noqa: BLE001
            pass

        return APIResponse.success(
            data=RealtimeSessionDetailSerializer(session).data,
            message="Session abandoned.",
        )


class SessionRealtimeToolAskNextQuestionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request, session_id: str, *args: Any, **kwargs: Any):
        from core.container import container

        provided_secret = request.headers.get("X-Tool-Secret", "")
        if not settings.ULTRAVOX_TOOL_SHARED_SECRET or provided_secret != settings.ULTRAVOX_TOOL_SHARED_SECRET:
            return APIResponse.error(message="Invalid tool credentials.", http_status=status.HTTP_401_UNAUTHORIZED)

        session = get_object_or_404(InterviewSession, pk=session_id)
        result_text, question_id = container.interview_orchestrator().handle_ask_next_question(
            session=session, arguments=cast(dict, request.data) if request.data else {},
        )
        return APIResponse.success(data={"result": result_text, "question_id": question_id})


class SessionRealtimeAccountWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request: Request, *args: Any, **kwargs: Any):
        from core.container import container
        from apps.ai.providers.realtime_voice.ultravox_provider import UltravoxRealtimeVoiceProvider

        timestamp = request.headers.get("X-Ultravox-Webhook-Timestamp", "")
        signature = request.headers.get("X-Ultravox-Webhook-Signature", "")
        secret = settings.ULTRAVOX_WEBHOOK_SECRET
        if secret:
            valid = UltravoxRealtimeVoiceProvider.verify_webhook_signature(
                body=request.body, timestamp=timestamp, signature_header=signature, secret=secret,
            )
            if not valid:
                return APIResponse.error(message="Invalid webhook signature.", http_status=status.HTTP_401_UNAUTHORIZED)

        payload: dict[str, Any] = json.loads(request.body or b"{}")
        call_id: str = payload.get("call", {}).get("callId", "")
        session = InterviewSession.objects.filter(call_id=call_id).first()
        if session is None:
            return APIResponse.success(data={}, http_status=status.HTTP_204_NO_CONTENT)

        event_type: str = payload.get("event", "unknown").replace(".", "_")
        container.interview_orchestrator().handle_lifecycle_event(
            session=session, event_type=event_type, raw_payload=payload,
        )
        return APIResponse.success(data={}, http_status=status.HTTP_204_NO_CONTENT)


class SessionCurrentTopicView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = []

    def get(self, request: Request, session_id: str, *args: Any, **kwargs: Any):
        provided_secret = request.headers.get("X-Tool-Secret", "")
        if not settings.ULTRAVOX_TOOL_SHARED_SECRET or provided_secret != settings.ULTRAVOX_TOOL_SHARED_SECRET:
            return APIResponse.error(message="Invalid credentials.", http_status=status.HTTP_401_UNAUTHORIZED)
        session = get_object_or_404(InterviewSession, pk=session_id)
        return APIResponse.success(data={
           "question_id": str(session.current_seed_topic.id) if session.current_seed_topic else None
        })
