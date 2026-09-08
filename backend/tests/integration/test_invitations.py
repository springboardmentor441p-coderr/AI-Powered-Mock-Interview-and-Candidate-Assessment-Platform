from datetime import timedelta
from unittest.mock import patch
import pytest
from django.urls import reverse
from django.utils import timezone

from apps.identity.models import User
from apps.interview.models import InterviewInvitation, InterviewSession, InterviewTemplate, InvitationStatus


@pytest.fixture
def test_template(db, recruiter_user):
    return InterviewTemplate.objects.create(
        created_by=recruiter_user,
        title="Senior Python Backend Engineer",
        interview_type="technical",
        domain="Backend Engineering",
        difficulty="hard",
        question_count=5,
    )


@pytest.mark.django_db
class TestInvitationsFlow:
    def test_send_invitation_creates_token_and_dispatches_email(self, api_client, recruiter_user, test_template):
        api_client.force_authenticate(user=recruiter_user)
        url = reverse("interview:invitation_send")

        with patch("apps.notification.tasks.email_tasks.send_invitation_email_task.delay") as mock_email_task:
            res = api_client.post(url, {
                "candidate_email": "jane.candidate@example.com",
                "template_id": str(test_template.id),
                "message": "Welcome to our technical interview!",
            })

            assert res.status_code == 201
            assert res.data["success"] is True
            inv_data = res.data["data"]
            assert inv_data["candidate_email"] == "jane.candidate@example.com"
            assert inv_data["token"] is not None
            assert len(inv_data["token"]) >= 32
            assert inv_data["status"] == InvitationStatus.PENDING
            assert inv_data["expires_at"] is not None

            # Verify email task dispatched
            mock_email_task.assert_called_once_with(inv_data["id"])

    def test_send_invitation_idempotent_duplicate_click(self, api_client, recruiter_user, test_template):
        api_client.force_authenticate(user=recruiter_user)
        url = reverse("interview:invitation_send")

        with patch("apps.notification.tasks.email_tasks.send_invitation_email_task.delay"):
            res1 = api_client.post(url, {
                "candidate_email": "dup@example.com",
                "template_id": str(test_template.id),
            })
            assert res1.status_code == 201
            inv_id1 = res1.data["data"]["id"]

            # Second click with same payload
            res2 = api_client.post(url, {
                "candidate_email": "dup@example.com",
                "template_id": str(test_template.id),
            })
            assert res2.status_code == 200
            assert res2.data["data"]["id"] == inv_id1

            # Only 1 invitation row in DB
            assert InterviewInvitation.objects.filter(candidate_email="dup@example.com").count() == 1

    def test_verify_invitation_public_endpoint(self, api_client, recruiter_user, test_template):
        inv = InterviewInvitation.objects.create(
            recruiter=recruiter_user,
            candidate_email="verify@example.com",
            template=test_template,
            status=InvitationStatus.SENT,
            expires_at=timezone.now() + timedelta(days=7),
        )

        url = reverse("interview:invitation_verify", kwargs={"token": inv.token})
        # Unauthenticated request
        res = api_client.get(url)
        assert res.status_code == 200
        assert res.data["data"]["token"] == inv.token
        assert res.data["data"]["template"]["title"] == "Senior Python Backend Engineer"
        # Transitions SENT -> OPENED
        inv.refresh_from_db()
        assert inv.status == InvitationStatus.OPENED

    def test_verify_invitation_detects_expiration(self, api_client, recruiter_user, test_template):
        inv = InterviewInvitation.objects.create(
            recruiter=recruiter_user,
            candidate_email="expired@example.com",
            template=test_template,
            status=InvitationStatus.PENDING,
            expires_at=timezone.now() - timedelta(minutes=5),  # already expired
        )

        url = reverse("interview:invitation_verify", kwargs={"token": inv.token})
        res = api_client.get(url)
        assert res.status_code == 200
        assert res.data["data"]["is_expired"] is True
        inv.refresh_from_db()
        assert inv.status == InvitationStatus.EXPIRED

    def test_accept_invitation_creates_session_and_is_idempotent(self, api_client, candidate_user, recruiter_user, test_template):
        inv = InterviewInvitation.objects.create(
            recruiter=recruiter_user,
            candidate_email=candidate_user.email,
            template=test_template,
            status=InvitationStatus.PENDING,
            expires_at=timezone.now() + timedelta(days=7),
        )

        api_client.force_authenticate(user=candidate_user)
        url = reverse("interview:invitation_accept", kwargs={"invitation_id": str(inv.id)})

        with patch("apps.interview.tasks.generate_seed_topics_task.delay") as mock_seed_task:
            res1 = api_client.post(url)
            assert res1.status_code == 201
            session_id = res1.data["data"]["id"]
            mock_seed_task.assert_called_once()

            inv.refresh_from_db()
            assert inv.status == InvitationStatus.ACCEPTED
            assert str(inv.session_id) == session_id

            # Duplicate accept click / refresh
            res2 = api_client.post(url)
            assert res2.status_code == 200
            assert res2.data["data"]["id"] == session_id

            # Only one session created
            assert InterviewSession.objects.filter(candidate=candidate_user).count() == 1

    def test_accept_invitation_blocks_expired_or_revoked(self, api_client, candidate_user, recruiter_user, test_template):
        api_client.force_authenticate(user=candidate_user)

        # Expired
        inv_expired = InterviewInvitation.objects.create(
            recruiter=recruiter_user,
            candidate_email=candidate_user.email,
            template=test_template,
            status=InvitationStatus.PENDING,
            expires_at=timezone.now() - timedelta(hours=1),
        )
        url_expired = reverse("interview:invitation_accept", kwargs={"invitation_id": str(inv_expired.id)})
        res = api_client.post(url_expired)
        assert res.status_code == 410

        # Revoked
        inv_revoked = InterviewInvitation.objects.create(
            recruiter=recruiter_user,
            candidate_email=candidate_user.email,
            template=test_template,
            status=InvitationStatus.REVOKED,
            expires_at=timezone.now() + timedelta(days=2),
        )
        url_revoked = reverse("interview:invitation_accept", kwargs={"invitation_id": str(inv_revoked.id)})
        res = api_client.post(url_revoked)
        assert res.status_code == 400

    def test_recruiter_can_revoke_and_resend_invitation(self, api_client, recruiter_user, test_template):
        inv = InterviewInvitation.objects.create(
            recruiter=recruiter_user,
            candidate_email="worker@example.com",
            template=test_template,
            status=InvitationStatus.PENDING,
            expires_at=timezone.now() + timedelta(days=2),
        )

        api_client.force_authenticate(user=recruiter_user)

        # Revoke
        revoke_url = reverse("interview:invitation_revoke", kwargs={"invitation_id": str(inv.id)})
        res = api_client.post(revoke_url)
        assert res.status_code == 200
        inv.refresh_from_db()
        assert inv.status == InvitationStatus.REVOKED

        # Resend
        with patch("apps.notification.tasks.email_tasks.send_invitation_email_task.delay") as mock_email:
            resend_url = reverse("interview:invitation_resend", kwargs={"invitation_id": str(inv.id)})
            res_resend = api_client.post(resend_url)
            assert res_resend.status_code == 200
            inv.refresh_from_db()
            assert inv.status == InvitationStatus.PENDING
            assert inv.expires_at > timezone.now() + timedelta(days=6)
            mock_email.assert_called_once_with(str(inv.id))
