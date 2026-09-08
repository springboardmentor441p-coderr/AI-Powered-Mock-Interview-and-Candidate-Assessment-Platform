from typing import TYPE_CHECKING, Any, cast

from rest_framework import generics, status
from rest_framework.request import Request
from rest_framework.views import APIView

from core.permissions import IsCandidate, IsRecruiterOrAdmin
from core.responses import APIResponse

from apps.interview.api.serializers.interview_serializer import (
    AnswerSerializer, CreateSessionSerializer,
    InterviewSessionDetailSerializer, InterviewSessionListSerializer,
    InterviewTemplateSerializer, SubmitAnswerSerializer,
)
from apps.interview.models import InterviewSession, InterviewTemplate
from apps.interview.selectors.session_selector import get_owned_session_or_404

if TYPE_CHECKING:
    from apps.identity.models import User


class InterviewTemplateListCreateView(generics.ListCreateAPIView):
    serializer_class = InterviewTemplateSerializer

    def get_queryset(self):  # type: ignore[override]
        user: "User" = self.request.user  # type: ignore[assignment]
        if user.role in ("recruiter", "admin"):  # type: ignore[union-attr]
            return InterviewTemplate.objects.all()
        return InterviewTemplate.objects.filter(is_active=True)

    def get_permissions(self):
        return [IsRecruiterOrAdmin()] if self.request.method == "POST" else super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class SessionListView(generics.ListAPIView):
    serializer_class = InterviewSessionListSerializer
    permission_classes = [IsCandidate]
    filterset_fields = ["status", "interview_type"]

    def get_queryset(self):  # type: ignore[override]
        return InterviewSession.objects.filter(candidate=self.request.user)


class SessionCreateView(APIView):
    permission_classes = [IsCandidate]

    def post(self, request: Request, *args, **kwargs):
        from core.container import container
        from apps.resume.selectors.resume_selector import get_primary_processed_resume

        serializer = CreateSessionSerializer(data=request.data)
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

        session = container.session_service().create_session(
            candidate=request.user,
            interview_type=data["interview_type"],
            domain=data["domain"],
            difficulty=data["difficulty"],
            question_count=data["question_count"],
            template=template,
            resume=resume,
        )
        return APIResponse.created(data=InterviewSessionDetailSerializer(session).data)


class SessionDetailView(generics.RetrieveAPIView):
    serializer_class = InterviewSessionDetailSerializer
    permission_classes = [IsCandidate]
    lookup_url_kwarg = "session_id"

    def get_queryset(self):  # type: ignore[override]
        return InterviewSession.objects.filter(candidate=self.request.user)


class SessionStartView(APIView):
    permission_classes = [IsCandidate]

    def post(self, request, session_id, *args, **kwargs):
        from core.container import container
        session = get_owned_session_or_404(candidate=request.user, session_id=session_id)
        session = container.session_service().start_session(session=session)
        return APIResponse.success(data=InterviewSessionDetailSerializer(session).data)


class SessionAnswerView(APIView):
    permission_classes = [IsCandidate]

    def post(self, request: Request, session_id, *args, **kwargs):
        from core.container import container
        serializer = SubmitAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = cast(dict[str, Any], serializer.validated_data)
        session = get_owned_session_or_404(candidate=request.user, session_id=session_id)
        answer = container.session_service().submit_answer(
            session=session,
            question_order=data["question_order"],
            answer_text=data.get("answer_text", ""),
            answer_audio=data.get("answer_audio"),
            answer_video=data.get("answer_video"),
            response_time_seconds=data.get("response_time_seconds"),
        )
        return APIResponse.success(data=AnswerSerializer(answer).data)


class SessionCompleteView(APIView):
    permission_classes = [IsCandidate]

    def post(self, request, session_id, *args, **kwargs):
        from core.container import container
        from apps.assessment.tasks.scoring_tasks import run_assessment_pipeline

        session = get_owned_session_or_404(candidate=request.user, session_id=session_id)
        already_completed = (session.status == InterviewSession.Status.COMPLETED)
        session = container.session_service().complete_session(session=session)
        if not already_completed:
            run_assessment_pipeline.delay(str(session.id))  # type: ignore[union-attr]
        return APIResponse.success(
            data=InterviewSessionDetailSerializer(session).data,
            message="Session completed. Assessment pipeline queued.",
            http_status=status.HTTP_200_OK,
        )
