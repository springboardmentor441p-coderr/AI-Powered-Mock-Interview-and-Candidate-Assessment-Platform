"""
Invitation views — recruiters send, track, revoke & resend; candidates receive, verify & accept.

Endpoints:
  POST /interviews/invitations/send/
  GET  /interviews/invitations/sent/
  GET  /interviews/invitations/received/
  GET  /interviews/invitations/verify/<token>/
  POST /interviews/invitations/<id>/accept/
  POST /interviews/invitations/<id>/revoke/
  POST /interviews/invitations/<id>/resend/
  GET  /interviews/invitations/history/
"""
from datetime import timedelta
from typing import TYPE_CHECKING, Any, cast

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.request import Request
from rest_framework.views import APIView

from core.permissions import IsCandidate, IsRecruiterOrAdmin
from core.responses import APIResponse

from apps.interview.models import (
    InterviewInvitation,
    InterviewSession,
    InterviewTemplate,
    InvitationStatus,
)
from apps.interview.api.serializers.invitation_serializer import (
    CandidateInvitationSerializer,
    InvitationListSerializer,
    PublicInvitationSerializer,
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
        from apps.notification.tasks.email_tasks import send_invitation_email_task

        serializer = SendInvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = cast(dict[str, Any], serializer.validated_data)

        template = None
        if data.get("template_id"):
            template = InterviewTemplate.objects.filter(
                pk=data["template_id"], is_active=True
            ).first()

        candidate_email = data["candidate_email"].strip().lower()

        # Idempotency check: if an active (pending/sent/opened) invitation already exists
        # for this recruiter + candidate + template, return it without creating duplicates.
        existing = (
            InterviewInvitation.objects.filter(
                recruiter=request.user,
                candidate_email=candidate_email,
                template=template,
                status__in=[
                    InvitationStatus.PENDING,
                    InvitationStatus.SENT,
                    InvitationStatus.OPENED,
                ],
            )
            .select_related("candidate", "template", "session")
            .first()
        )
        if existing and not existing.is_expired:
            return APIResponse.success(
                data=InvitationListSerializer(existing).data,
                message="An active invitation already exists for this candidate.",
                http_status=status.HTTP_200_OK,
            )

        candidate_user = User.objects.filter(
            email=candidate_email, role="candidate"
        ).first()

        expires_at = timezone.now() + timedelta(days=7)

        with transaction.atomic():
            invitation = InterviewInvitation.objects.create(
                recruiter=request.user,
                candidate_email=candidate_email,
                candidate=candidate_user,
                template=template,
                message=data.get("message", ""),
                status=InvitationStatus.PENDING,
                expires_at=expires_at,
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
                        "token": invitation.token,
                        "recruiter_name": request.user.get_full_name(),  # type: ignore[union-attr]
                        "template_id": str(template.id) if template else None,
                    },
                )

        # Dispatch async email delivery
        try:
            send_invitation_email_task.delay(str(invitation.id))  # type: ignore
        except Exception:
            # Celery broker down in dev should not crash invitation creation
            pass

        return APIResponse.created(data=InvitationListSerializer(invitation).data)


class VerifyInvitationView(APIView):
    """
    GET /api/v1/interviews/invitations/verify/<token>/
    Public endpoint: candidate verifies invitation token from email link.
    Transitions status to OPENED if it was SENT.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request: Request, token: str, *args: Any, **kwargs: Any):
        invitation = (
            InterviewInvitation.objects.filter(token=token)
            .select_related("recruiter", "template", "session")
            .first()
        )
        if invitation is None:
            return APIResponse.error(
                message="Invitation not found. Please check your link.",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        if invitation.is_expired and invitation.status != InvitationStatus.EXPIRED:
            invitation.status = InvitationStatus.EXPIRED
            invitation.save(update_fields=["status", "updated_at"])

        if invitation.status == InvitationStatus.SENT:
            invitation.status = InvitationStatus.OPENED
            invitation.save(update_fields=["status", "updated_at"])

        return APIResponse.success(data=PublicInvitationSerializer(invitation).data)


class AcceptInvitationView(APIView):
    """
    POST — candidate accepts an invitation → creates or resumes realtime session.
    Guaranteed idempotent via row-locking: double-clicks or page reloads
    safely return the existing session without creating duplicate sessions.
    """

    permission_classes = [IsCandidate]

    def post(self, request: Request, invitation_id: Any, *args: Any, **kwargs: Any):
        from core.container import container
        from apps.resume.selectors.resume_selector import get_primary_processed_resume
        from apps.interview.tasks import generate_seed_topics_task

        user: "User" = request.user  # type: ignore[assignment]

        with transaction.atomic():
            invitation = (
                InterviewInvitation.objects.select_for_update(of=("self",))
                .filter(pk=invitation_id, candidate_email=user.email)
                .select_related("template", "session")
                .first()
            )

            if invitation is None:
                return APIResponse.error(
                    message="Invitation not found.",
                    http_status=status.HTTP_404_NOT_FOUND,
                )

            # Check expiration
            if invitation.is_expired:
                if invitation.status != InvitationStatus.EXPIRED:
                    invitation.status = InvitationStatus.EXPIRED
                    invitation.save(update_fields=["status", "updated_at"])
                return APIResponse.error(
                    message="This invitation has expired. Please ask the recruiter for a new link.",
                    http_status=status.HTTP_410_GONE,
                )

            # Check terminal states
            if invitation.status == InvitationStatus.REVOKED:
                return APIResponse.error(
                    message="This invitation has been revoked by the recruiter.",
                    http_status=status.HTTP_400_BAD_REQUEST,
                )
            if invitation.status == InvitationStatus.DECLINED:
                return APIResponse.error(
                    message="This invitation was previously declined.",
                    http_status=status.HTTP_400_BAD_REQUEST,
                )

            # Idempotency: if already accepted and session exists, return existing session!
            if invitation.status == InvitationStatus.ACCEPTED and invitation.session:
                return APIResponse.success(
                    data=RealtimeSessionDetailSerializer(invitation.session).data,
                    message="Invitation already accepted. Returning active session.",
                    http_status=status.HTTP_200_OK,
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

            # Set status to PREPARING explicitly
            session.status = InterviewSession.Status.PREPARING
            session.save(update_fields=["status", "updated_at"])

            invitation.session = session
            invitation.candidate = request.user  # type: ignore[assignment]
            invitation.status = InvitationStatus.ACCEPTED
            invitation.save(update_fields=["session", "candidate", "status", "updated_at"])

        # Dispatch async seed topic generation outside the transaction lock
        try:
            generate_seed_topics_task.delay(str(session.id), topic_count)  # type: ignore
        except Exception:
            pass

        return APIResponse.created(data=RealtimeSessionDetailSerializer(session).data)


class RevokeInvitationView(APIView):
    """POST — recruiter revokes a pending invitation."""

    permission_classes = [IsRecruiterOrAdmin]

    def post(self, request: Request, invitation_id: Any, *args: Any, **kwargs: Any):
        invitation = get_object_or_404(
            InterviewInvitation,
            pk=invitation_id,
            recruiter=request.user,
        )

        if invitation.status == InvitationStatus.ACCEPTED and invitation.session:
            if invitation.session.status in (
                InterviewSession.Status.IN_PROGRESS,
                InterviewSession.Status.COMPLETED,
            ):
                return APIResponse.error(
                    message="Cannot revoke an invitation for an interview that is already in progress or completed.",
                    http_status=status.HTTP_409_CONFLICT,
                )

        invitation.status = InvitationStatus.REVOKED
        invitation.save(update_fields=["status", "updated_at"])
        return APIResponse.success(
            data=InvitationListSerializer(invitation).data,
            message="Invitation revoked successfully.",
        )


class ResendInvitationView(APIView):
    """POST — recruiter extends expiration and resends invitation email."""

    permission_classes = [IsRecruiterOrAdmin]

    def post(self, request: Request, invitation_id: Any, *args: Any, **kwargs: Any):
        from apps.notification.tasks.email_tasks import send_invitation_email_task

        invitation = get_object_or_404(
            InterviewInvitation,
            pk=invitation_id,
            recruiter=request.user,
        )

        if invitation.status == InvitationStatus.ACCEPTED and invitation.session:
            if invitation.session.status == InterviewSession.Status.COMPLETED:
                return APIResponse.error(
                    message="Candidate has already completed this interview.",
                    http_status=status.HTTP_409_CONFLICT,
                )

        invitation.expires_at = timezone.now() + timedelta(days=7)
        if invitation.status in (InvitationStatus.EXPIRED, InvitationStatus.REVOKED):
            invitation.status = InvitationStatus.PENDING
        invitation.save(update_fields=["expires_at", "status", "updated_at"])

        try:
            send_invitation_email_task.delay(str(invitation.id))  # type: ignore
        except Exception:
            pass

        return APIResponse.success(
            data=InvitationListSerializer(invitation).data,
            message="Invitation resent successfully.",
        )


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


class RecruiterSessionHistoryView(APIView):
    """
    GET /interviews/invitations/history/
    Recruiter sees ALL accepted invitations (any session status),
    not just completed ones — so they can track in-progress,
    connection-lost, and abandoned/failed sessions too.
    """

    permission_classes = [IsRecruiterOrAdmin]

    def get(self, request: Request, *args: Any, **kwargs: Any):
        invitations = (
            InterviewInvitation.objects.filter(
                recruiter=request.user,
                status=InvitationStatus.ACCEPTED,
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
