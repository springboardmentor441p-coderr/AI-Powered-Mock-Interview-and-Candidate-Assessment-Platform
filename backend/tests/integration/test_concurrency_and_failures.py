from datetime import timedelta
from unittest.mock import MagicMock, patch
import uuid
import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from core.exceptions import ExternalServiceError
from apps.identity.models import User
from apps.interview.models import (
    InterviewSession,
    InterviewInvitation,
    InvitationStatus,
    InterviewTemplate,
    ConversationTurn,
)
from apps.interview.tasks import check_stale_sessions_task, generate_seed_topics_task
from apps.notification.tasks.email_tasks import send_invitation_email_task


@pytest.fixture
def test_template(db, recruiter_user):
    return InterviewTemplate.objects.create(
        created_by=recruiter_user,
        title="Full Stack Engineer",
        interview_type="technical",
        domain="Web Development",
        difficulty="medium",
        question_count=4,
    )


@pytest.mark.django_db
class TestConcurrencyAndIdempotency:
    def test_concurrent_start_interview_requests_are_idempotent(self, candidate_user):
        from apps.ai.providers.realtime_voice.interfaces import RealtimeCallHandle
        from core.container import container

        session = InterviewSession.objects.create(
            candidate=candidate_user,
            mode=InterviewSession.Mode.REALTIME,
            status=InterviewSession.Status.READY,
            interview_type="technical",
            domain="Full Stack",
            difficulty="medium",
            seed_topics_ready=True,
        )

        mock_handle = RealtimeCallHandle(
            call_id="call-concurrent-123",
            join_url="https://live.ultravox.mock/call-concurrent-123",
            provider="ultravox",
        )

        orchestrator = container.interview_orchestrator()
        with patch.object(orchestrator._provider, "create_call", return_value=mock_handle) as mock_create:
            # Simulate Request 1
            s1 = orchestrator.start_realtime_session(session=session)
            # Simulate Request 2 (e.g. concurrent double-click)
            s2 = orchestrator.start_realtime_session(session=s1)

            assert s1.id == s2.id
            assert s1.call_id == "call-concurrent-123"
            assert s2.call_id == "call-concurrent-123"
            assert s2.status == InterviewSession.Status.IN_PROGRESS
            # Provider create_call must be called exactly once
            assert mock_create.call_count == 1

    def test_duplicate_complete_interview_is_idempotent(self, candidate_user):
        session = InterviewSession.objects.create(
            candidate=candidate_user,
            mode=InterviewSession.Mode.REALTIME,
            status=InterviewSession.Status.IN_PROGRESS,
            interview_type="technical",
            domain="Full Stack",
            difficulty="medium",
        )

        client = APIClient()
        client.force_authenticate(user=candidate_user)

        with patch("apps.assessment.tasks.scoring_tasks.run_assessment_pipeline.delay") as mock_pipeline:
            # First completion request
            res1 = client.post(f"/api/v1/interviews/sessions/{session.id}/complete/")
            assert res1.status_code == 200
            session.refresh_from_db()
            assert session.status == InterviewSession.Status.COMPLETED

            # Second completion request (duplicate click / network retry)
            res2 = client.post(f"/api/v1/interviews/sessions/{session.id}/complete/")
            assert res2.status_code == 200
            session.refresh_from_db()
            assert session.status == InterviewSession.Status.COMPLETED

            # Pipeline was only queued once
            assert mock_pipeline.call_count == 1

    def test_concurrent_accept_invitation_returns_same_session(self, candidate_user, recruiter_user, test_template):
        invitation = InterviewInvitation.objects.create(
            recruiter=recruiter_user,
            candidate_email=candidate_user.email,
            candidate=candidate_user,
            template=test_template,
            status=InvitationStatus.SENT,
        )

        client = APIClient()
        client.force_authenticate(user=candidate_user)

        with patch("apps.interview.tasks.generate_seed_topics_task.delay"):
            # First accept request
            res1 = client.post(f"/api/v1/interviews/invitations/{invitation.id}/accept/")
            assert res1.status_code == 201
            session_id_1 = res1.data["data"]["id"]

            # Second accept request
            res2 = client.post(f"/api/v1/interviews/invitations/{invitation.id}/accept/")
            assert res2.status_code == 200
            session_id_2 = res2.data["data"]["id"]

            assert session_id_1 == session_id_2


@pytest.mark.django_db
class TestFailureInjectionAndRecovery:
    def test_email_delivery_failure_is_handled_gracefully(self, recruiter_user, test_template):
        invitation = InterviewInvitation.objects.create(
            recruiter=recruiter_user,
            candidate_email="test.delivery@example.com",
            template=test_template,
            status=InvitationStatus.PENDING,
        )

        from apps.notification.services.email_service import EmailService
        # Simulate third-party email provider outage (e.g. SMTP down or SendGrid 503)
        with patch.object(
            EmailService,
            "send_invitation",
            side_effect=ExternalServiceError("Email provider temporarily unavailable"),
        ):
            with pytest.raises(Exception):
                send_invitation_email_task(str(invitation.id))

            invitation.refresh_from_db()
            # Invitation must NOT be marked sent if provider failed
            assert invitation.status == InvitationStatus.PENDING

    def test_seed_generation_transient_error_retries_and_fatal_error_fails(self, candidate_user):
        session = InterviewSession.objects.create(
            candidate=candidate_user,
            mode=InterviewSession.Mode.REALTIME,
            status=InterviewSession.Status.PREPARING,
            interview_type="technical",
            domain="DevOps",
            difficulty="hard",
        )

        from apps.interview.services.seed_topic_service import SeedTopicService

        # 1. Fatal unhandled exception sets status to PREPARATION_FAILED
        with patch.object(
            SeedTopicService,
            "generate_and_store",
            side_effect=RuntimeError("AI model crashed unexpectedly"),
        ):
            with pytest.raises(RuntimeError):
                generate_seed_topics_task(str(session.id), topic_count=3)

            session.refresh_from_db()
            assert session.status == InterviewSession.Status.PREPARATION_FAILED

    def test_session_recovery_after_network_dropout(self, candidate_user):
        session = InterviewSession.objects.create(
            candidate=candidate_user,
            mode=InterviewSession.Mode.REALTIME,
            status=InterviewSession.Status.IN_PROGRESS,
            interview_type="technical",
            domain="Backend",
            difficulty="medium",
            last_seen_at=timezone.now() - timedelta(seconds=45),
        )

        # Watchdog marks connection lost
        check_stale_sessions_task()
        session.refresh_from_db()
        assert session.status == InterviewSession.Status.CONNECTION_LOST

        # Candidate reconnects and sends heartbeat
        client = APIClient()
        client.force_authenticate(user=candidate_user)
        res = client.post(f"/api/v1/interviews/realtime/sessions/{session.id}/heartbeat/")
        assert res.status_code == 200

        session.refresh_from_db()
        # Session recovered back to in_progress!
        assert session.status == InterviewSession.Status.IN_PROGRESS
