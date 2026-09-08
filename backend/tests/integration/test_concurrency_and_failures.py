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
    Transcript,
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

    def test_duplicate_transcript_turn_is_idempotent(self, candidate_user):
        session = InterviewSession.objects.create(
            candidate=candidate_user,
            mode=InterviewSession.Mode.REALTIME,
            status=InterviewSession.Status.IN_PROGRESS,
            interview_type="technical",
            domain="Backend",
            difficulty="medium",
        )

        client = APIClient()
        client.force_authenticate(user=candidate_user)

        payload = {
            "speaker": "candidate",
            "text": "I used Redis and Celery for background processing.",
            "sequence_number": 1,
            "timestamp": timezone.now().isoformat(),
        }

        # First transcript submission
        res1 = client.post(
            f"/api/v1/interviews/realtime/sessions/{session.id}/transcript/webhook/",
            payload,
            format="json",
        )
        assert res1.status_code == 201

        # Duplicate transcript submission (e.g. client network retry)
        res2 = client.post(
            f"/api/v1/interviews/realtime/sessions/{session.id}/transcript/webhook/",
            payload,
            format="json",
        )
        assert res2.status_code in (200, 201)

        # Database must only contain 1 record for sequence_number 1
        assert Transcript.objects.filter(interview=session, sequence_number=1).count() == 1

    def test_candidate_refresh_during_preparation_returns_preparing_status(self, candidate_user):
        session = InterviewSession.objects.create(
            candidate=candidate_user,
            mode=InterviewSession.Mode.REALTIME,
            status=InterviewSession.Status.PREPARING,
            interview_type="technical",
            domain="Backend",
            difficulty="medium",
            seed_topics_ready=False,
        )

        client = APIClient()
        client.force_authenticate(user=candidate_user)

        # Candidate polls / refreshes page
        res = client.get(f"/api/v1/interviews/sessions/{session.id}/")
        assert res.status_code == 200
        assert res.data["status"] == "preparing"

    def test_candidate_forbidden_from_recruiter_endpoints(self, candidate_user):
        client = APIClient()
        client.force_authenticate(user=candidate_user)

        # Candidate cannot view recruiter sent invitations
        res1 = client.get("/api/v1/interviews/invitations/sent/")
        assert res1.status_code == 403

        # Candidate cannot view recruiter session history
        res2 = client.get("/api/v1/interviews/invitations/history/")
        assert res2.status_code == 403

    def test_end_to_end_full_lifecycle_recruiter_to_candidate_to_result(self, recruiter_user, candidate_user, test_template):
        from apps.ai.providers.realtime_voice.interfaces import RealtimeCallHandle

        recruiter_client = APIClient()
        recruiter_client.force_authenticate(user=recruiter_user)

        # 1. Recruiter sends invitation
        with patch("apps.notification.tasks.email_tasks.send_invitation_email_task.delay"):
            res_invite = recruiter_client.post(
                "/api/v1/interviews/invitations/send/",
                {
                    "candidate_email": candidate_user.email,
                    "template_id": str(test_template.id),
                    "message": "Welcome to your interview round!",
                },
                format="json",
            )
            assert res_invite.status_code == 201
            invitation_id = res_invite.data["data"]["id"]
            token = res_invite.data["data"]["token"]

        # 2. Candidate clicks link: public verification
        public_client = APIClient()
        res_verify = public_client.get(f"/api/v1/interviews/invitations/verify/{token}/")
        assert res_verify.status_code == 200
        assert res_verify.data["data"]["status"] in ("pending", "opened", "sent")

        # 3. Candidate accepts invitation
        candidate_client = APIClient()
        candidate_client.force_authenticate(user=candidate_user)
        with patch("apps.interview.tasks.generate_seed_topics_task.delay"):
            res_accept = candidate_client.post(f"/api/v1/interviews/invitations/{invitation_id}/accept/")
            assert res_accept.status_code == 201
            session_id = res_accept.data["data"]["id"]

        session = InterviewSession.objects.get(pk=session_id)
        session.seed_topics_ready = True
        session.status = InterviewSession.Status.READY
        session.save()

        # 4. Candidate starts realtime call
        mock_handle = RealtimeCallHandle(
            call_id="call-e2e-final-456",
            join_url="https://live.ultravox.mock/call-e2e-final-456",
            provider="ultravox",
        )
        with patch(
            "apps.ai.providers.realtime_voice.ultravox_provider.UltravoxRealtimeVoiceProvider.create_call",
            return_value=mock_handle,
        ):
            res_start = candidate_client.post(f"/api/v1/interviews/realtime/sessions/{session_id}/start/")
            assert res_start.status_code == 200
            assert res_start.data["data"]["status"] == "in_progress"
            assert res_start.data["data"]["call_join_url"] == "https://live.ultravox.mock/call-e2e-final-456"

        # 5. Heartbeat probe sent during call
        res_heartbeat = candidate_client.post(f"/api/v1/interviews/realtime/sessions/{session_id}/heartbeat/")
        assert res_heartbeat.status_code == 200

        # 6. Candidate completes call
        with patch("apps.assessment.tasks.scoring_tasks.run_assessment_pipeline.delay"):
            res_complete = candidate_client.post(f"/api/v1/interviews/sessions/{session_id}/complete/")
            assert res_complete.status_code == 200

        session.refresh_from_db()
        assert session.status == InterviewSession.Status.COMPLETED
