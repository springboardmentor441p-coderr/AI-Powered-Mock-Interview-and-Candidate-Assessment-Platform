"""
Invitation views — recruiters send, candidates receive & accept.

Endpoints:
  POST /interviews/invitations/send/
  GET  /interviews/invitations/sent/
  GET  /interviews/invitations/received/
  POST /interviews/invitations/<id>/accept/
  GET  /interviews/invitations/history/
"""

from typing import TYPE_CHECKING, Any, cast

from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.request import Request
from rest_framework.views import APIView

from core.permissions import IsCandidate, IsRecruiterOrAdmin
from core.responses import APIResponse

from apps.interview.models import InterviewInvitation, InterviewSession, InterviewTemplate
from apps.interview.api.serializers.invitation_serializer import (
    CandidateInvitationSerializer,
    InvitationListSerializer,
    SendInvitationSerializer,
)
from apps.interview.api.serializers.interview_serializer import RealtimeSessionDetailSerializer

if TYPE_CHECKING:
    from apps.identity.models import User


class SendInvitationView(APIView):
    """POST — recruiter sends an interview invitation to a candidate email."""

    permission_classes = [IsRecruiterOrAdmin]

    def post(self, request: Request, *args: Any, **kwargs: Any):
        from apps.identity.models import User
        from apps.notification.models import Notification, NotificationType

        serializer = SendInvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = cast(dict[str, Any], serializer.validated_data)

        template = None
        if data.get("template_id"):
            template = InterviewTemplate.objects.filter(
                pk=data["template_id"], is_active=True
            ).first()

        candidate_user = User.objects.filter(
            email=data["candidate_email"], role="candidate"
        ).first()

        invitation = InterviewInvitation.objects.create(
            recruiter=request.user,
            candidate_email=data["candidate_email"],
            candidate=candidate_user,
            template=template,
            message=data.get("message", ""),
        )

        if candidate_user:
            template_info = f" for a {template.title} interview" if template else ""
            Notification.objects.create(
                recipient=candidate_user,
                notification_type=NotificationType.INTERVIEW_INVITATION,
                title="You have been invited to an interview",
                message=(
                    f"{request.user.get_full_name()} has invited you to take an AI mock interview"  # type: ignore[union-attr]
                    f"{template_info} on SmartHire."
                    + (f"\n\nNote: {invitation.message}" if invitation.message else "")
                ),
                metadata={
                    "invitation_id": str(invitation.id),
                    "recruiter_name": request.user.get_full_name(),  # type: ignore[union-attr]
                    "template_id": str(template.id) if template else None,
                },
            )

        return APIResponse.created(data=InvitationListSerializer(invitation).data)


class SentInvitationsView(generics.ListAPIView):
    """GET — recruiter sees all invitations they sent."""

    serializer_class = InvitationListSerializer
    permission_classes = [IsRecruiterOrAdmin]

    def get_queryset(self):  # type: ignore[override]
        return (
            InterviewInvitation.objects.filter(recruiter=self.request.user)
            .select_related("candidate", "template", "session")
            .order_by("-created_at")
        )


class ReceivedInvitationsView(generics.ListAPIView):
    """GET — candidate sees all invitations addressed to their email."""

    serializer_class = CandidateInvitationSerializer
    permission_classes = [IsCandidate]

    def get_queryset(self):  # type: ignore[override]
        user: "User" = self.request.user  # type: ignore[assignment]
        return (
            InterviewInvitation.objects.filter(candidate_email=user.email)
            .select_related("recruiter", "template", "session")
            .order_by("-created_at")
        )


class AcceptInvitationView(APIView):
    """POST — candidate accepts an invitation → creates realtime session."""

    permission_classes = [IsCandidate]

    def post(self, request: Request, invitation_id: Any, *args: Any, **kwargs: Any):
        from core.container import container
        from apps.resume.selectors.resume_selector import get_primary_processed_resume
        from apps.interview.tasks import generate_seed_topics_task

        user: "User" = request.user  # type: ignore[assignment]

        invitation = get_object_or_404(
            InterviewInvitation,
            pk=invitation_id,
            candidate_email=user.email,
        )

        if invitation.status != "pending":
            return APIResponse.success(
                data={"detail": "This invitation has already been accepted or expired."},
                http_status=status.HTTP_409_CONFLICT,
            )

        template = invitation.template
        resume = None
        try:
            resume = get_primary_processed_resume(candidate=request.user)
        except Exception:  # noqa: BLE001
            pass

        interview_type = template.interview_type if template else "technical"
        domain = template.domain if template else "General"
        difficulty = template.difficulty if template else "medium"
        topic_count = max(template.question_count, 3) if template else 6

        session = container.session_service().create_realtime_session(
            candidate=request.user,
            interview_type=interview_type,
            domain=domain,
            difficulty=difficulty,
            topic_count=0,
            template=template,
            resume=resume,
        )

        generate_seed_topics_task.delay(str(session.id), topic_count)  # type: ignore[union-attr]

        invitation.session = session
        invitation.candidate = request.user  # type: ignore[assignment]
        invitation.status = "accepted"
        invitation.save(update_fields=["session", "candidate", "status", "updated_at"])

        return APIResponse.created(data=RealtimeSessionDetailSerializer(session).data)


class RecruiterSessionHistoryView(APIView):
    """
    GET /interviews/invitations/history/
    Recruiter sees ALL accepted invitations (any session status),
    not just completed ones — so they can track in-progress and
    abandoned/failed sessions too.
    """

    permission_classes = [IsRecruiterOrAdmin]

    def get(self, request: Request, *args: Any, **kwargs: Any):
        invitations = (
            InterviewInvitation.objects.filter(
                recruiter=request.user,
                status="accepted",
                session__isnull=False,
            )
            .select_related("candidate", "template", "session")
            .order_by("-created_at")
        )

        items = []
        for inv in invitations:
            session = inv.session
            if session is None:
                continue
            has_brief = session.status == InterviewSession.Status.COMPLETED
            items.append(
                {
                    "invitation_id": str(inv.id),
                    "candidate_email": inv.candidate_email,
                    "candidate_name": inv.candidate.get_full_name() if inv.candidate else None,
                    "candidate_id": str(inv.candidate.id) if inv.candidate else None,
                    "session_id": str(session.id),
                    "interview_type": session.interview_type,
                    "domain": session.domain,
                    "difficulty": session.difficulty,
                    "status": session.status,
                    "started_at": session.started_at,
                    "completed_at": session.completed_at,
                    "duration_seconds": session.duration_seconds,
                    "has_brief": has_brief,
                    "created_at": session.created_at,
                }
            )

        return APIResponse.success(data={"items": items, "count": len(items)})
