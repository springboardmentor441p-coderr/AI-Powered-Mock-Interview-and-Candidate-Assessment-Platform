from datetime import timedelta
from unittest.mock import MagicMock, patch
import uuid
import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.identity.models import User
from apps.interview.models import (
    InterviewSession,
    InterviewInvitation,
    InvitationStatus,
    InterviewBrief,
    Question,
)
from apps.interview.tasks import check_stale_sessions_task, generate_seed_topics_task


@pytest.fixture
def other_candidate(db):
    return User.objects.create_user(
        email="other.cand@example.com",
        password="ValidPassword123!",
        first_name="Other",
        last_name="Cand",
        role=User.Role.CANDIDATE,
    )


@pytest.fixture
def realtime_session(db, candidate_user):
    return InterviewSession.objects.create(
        candidate=candidate_user,
        mode=InterviewSession.Mode.REALTIME,
        status=InterviewSession.Status.IN_PROGRESS,
        interview_type="technical",
        domain="Backend Development",
        difficulty="medium",
        last_seen_at=timezone.now(),
    )


@pytest.mark.django_db
class TestInterviewLifecycle:
    def test_heartbeat_updates_last_seen_and_recovers_connection(self, candidate_user, realtime_session, other_candidate):
        client = APIClient()
        client.force_authenticate(user=candidate_user)

        client_uuid = str(uuid.uuid4())
        old_seen = timezone.now() - timedelta(seconds=20)
        realtime_session.last_seen_at = old_seen
        realtime_session.save()

        response = client.post(
            f"/api/v1/interviews/realtime/sessions/{realtime_session.id}/heartbeat/",
            {"client_session_id": client_uuid},
            format="json",
        )
        assert response.status_code == 200
        realtime_session.refresh_from_db()
        assert realtime_session.last_seen_at > old_seen
        assert str(realtime_session.client_session_id) == client_uuid

        # Connection lost recovers back to in_progress
        realtime_session.status = InterviewSession.Status.CONNECTION_LOST
        realtime_session.save()

        response2 = client.post(
            f"/api/v1/interviews/realtime/sessions/{realtime_session.id}/heartbeat/",
            format="json",
        )
        assert response2.status_code == 200
        realtime_session.refresh_from_db()
        assert realtime_session.status == InterviewSession.Status.IN_PROGRESS

        # Another candidate cannot send heartbeat to this session (404 Not Found)
        other_client = APIClient()
        other_client.force_authenticate(user=other_candidate)
        res_unauth = other_client.post(
            f"/api/v1/interviews/realtime/sessions/{realtime_session.id}/heartbeat/",
            format="json",
        )
        assert res_unauth.status_code == 404

    def test_watchdog_detects_stale_and_abandons(self, candidate_user, realtime_session):
        now = timezone.now()

        # 1. Heartbeat 45 seconds ago -> should transition to CONNECTION_LOST
        realtime_session.last_seen_at = now - timedelta(seconds=45)
        realtime_session.save()

        check_stale_sessions_task()
        realtime_session.refresh_from_db()
        assert realtime_session.status == InterviewSession.Status.CONNECTION_LOST

        # 2. Heartbeat 120 seconds ago -> should transition to ABANDONED
        realtime_session.last_seen_at = now - timedelta(seconds=120)
        realtime_session.save()

        check_stale_sessions_task()
        realtime_session.refresh_from_db()
        assert realtime_session.status == InterviewSession.Status.ABANDONED

        # 3. Completed session with old last_seen is NOT abandoned
        realtime_session.status = InterviewSession.Status.COMPLETED
        realtime_session.save()
        check_stale_sessions_task()
        realtime_session.refresh_from_db()
        assert realtime_session.status == InterviewSession.Status.COMPLETED

    def test_explicit_abandon_endpoint(self, candidate_user, recruiter_user, realtime_session):
        client = APIClient()
        client.force_authenticate(user=candidate_user)

        invitation = InterviewInvitation.objects.create(
            recruiter=recruiter_user,
            candidate_email=candidate_user.email,
            candidate=candidate_user,
            session=realtime_session,
            status=InvitationStatus.ACCEPTED,
        )

        response = client.post(
            f"/api/v1/interviews/realtime/sessions/{realtime_session.id}/abandon/",
            format="json",
        )
        assert response.status_code == 200
        realtime_session.refresh_from_db()
        invitation.refresh_from_db()

        assert realtime_session.status == InterviewSession.Status.ABANDONED
        assert invitation.status == InvitationStatus.ABANDONED

    def test_start_realtime_session_is_idempotent(self, candidate_user, recruiter_user):
        from apps.ai.providers.realtime_voice.interfaces import RealtimeCallHandle
        from core.container import container

        session = InterviewSession.objects.create(
            candidate=candidate_user,
            mode=InterviewSession.Mode.REALTIME,
            status=InterviewSession.Status.READY,
            interview_type="technical",
            domain="Backend Development",
            difficulty="medium",
            seed_topics_ready=True,
        )

        mock_handle = RealtimeCallHandle(
            call_id="call-mock-999",
            join_url="https://live.ultravox.mock/call-mock-999",
            provider="ultravox",
        )

        orchestrator = container.interview_orchestrator()
        with patch.object(
            orchestrator._provider,
            "create_call",
            return_value=mock_handle,
        ) as mock_create:
            # First start call
            s1 = orchestrator.start_realtime_session(session=session)
            assert s1.status == InterviewSession.Status.IN_PROGRESS
            assert s1.call_id == "call-mock-999"
            assert mock_create.call_count == 1

            # Second start call (e.g. candidate double-clicked or refreshed)
            s2 = orchestrator.start_realtime_session(session=s1)
            assert s2.status == InterviewSession.Status.IN_PROGRESS
            assert s2.call_id == "call-mock-999"
            # create_call was NOT called again!
            assert mock_create.call_count == 1

    def test_generate_seed_topics_task_lifecycle(self, candidate_user):
        session = InterviewSession.objects.create(
            candidate=candidate_user,
            mode=InterviewSession.Mode.REALTIME,
            status=InterviewSession.Status.PREPARING,
            interview_type="technical",
            domain="System Design",
            difficulty="hard",
            seed_topics_ready=False,
        )

        from apps.interview.services.seed_topic_service import SeedTopicService
        with patch.object(SeedTopicService, "generate_and_store") as mock_gen:
            def fake_gen(*args, **kwargs):
                sess = kwargs.get("session") or (args[1] if len(args) > 1 else args[0])
                sess.seed_topics_ready = True
                Question.objects.create(
                    session=sess,
                    text="Design a distributed cache",
                    category="System Design",
                    order=1,
                )
                sess.save(update_fields=["seed_topics_ready"])

            mock_gen.side_effect = fake_gen

            # Run task
            generate_seed_topics_task(str(session.id), topic_count=3)
            session.refresh_from_db()
            assert session.status == InterviewSession.Status.READY
            assert session.seed_topics_ready is True
            assert mock_gen.call_count == 1

            # Run again -> already has seed topics -> skips generation cleanly
            generate_seed_topics_task(str(session.id), topic_count=3)
            assert mock_gen.call_count == 1  # Not called again

    def test_brief_and_verdict_authorization(self, candidate_user, other_candidate, recruiter_user, realtime_session):
        brief = InterviewBrief.objects.create(
            interview=realtime_session,
            summary="Excellent technical depth.",
            overall_signal="strong",
        )

        # 1. Owning candidate can view brief
        client_cand = APIClient()
        client_cand.force_authenticate(user=candidate_user)
        res1 = client_cand.get(f"/api/v1/interviews/realtime/sessions/{realtime_session.id}/brief/")
        assert res1.status_code == 200
        assert res1.data["data"]["overall_signal"] == "strong"

        # 2. Other candidate CANNOT view brief (403 Forbidden)
        client_other = APIClient()
        client_other.force_authenticate(user=other_candidate)
        res2 = client_other.get(f"/api/v1/interviews/realtime/sessions/{realtime_session.id}/brief/")
        assert res2.status_code == 403

        # 3. Candidate CANNOT patch human verdict (403 Forbidden)
        res3 = client_cand.patch(
            f"/api/v1/interviews/realtime/sessions/{realtime_session.id}/brief/",
            {"human_verdict": "advance", "human_notes": "Self approved"},
            format="json",
        )
        assert res3.status_code == 403

        # 4. Recruiter CAN patch human verdict (200 OK)
        client_recruiter = APIClient()
        client_recruiter.force_authenticate(user=recruiter_user)
        res4 = client_recruiter.patch(
            f"/api/v1/interviews/realtime/sessions/{realtime_session.id}/brief/",
            {"human_verdict": "advance", "human_notes": "Great candidate!"},
            format="json",
        )
        assert res4.status_code == 200
        brief.refresh_from_db()
        assert brief.human_verdict == "advance"
        assert brief.human_notes == "Great candidate!"
