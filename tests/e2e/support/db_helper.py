"""
db_helper.py - Direct Django ORM CLI helper for Playwright E2E tests.
Allows tests to set up fixtures and assert database state without bypassing API flows.
"""
import os
import sys
import json
import django  # type: ignore
from datetime import timedelta

# Set up Django
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
sys.path.insert(0, BACKEND_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.contrib.auth import get_user_model  # type: ignore
from django.utils import timezone  # type: ignore
from apps.interview.models import (  # type: ignore
    InterviewTemplate,
    InterviewInvitation,
    InterviewSession,
    InvitationStatus,
    ConversationTurn,
    Transcript,
)
from apps.assessment.models import FaceAssessmentSnapshot  # type: ignore

User = get_user_model()

def reset_test_data():
    """Resets test invitations and sessions, keeping the recruiter and candidate accounts."""
    InterviewSession.objects.filter(candidate__email="candidate@example.com").delete()
    InterviewInvitation.objects.filter(candidate_email="candidate@example.com").delete()

    recruiter, _ = User.objects.get_or_create(
        email="recruiter@example.com",
        defaults={"first_name": "Sarah", "last_name": "Recruiter", "role": "recruiter", "is_active": True}
    )
    recruiter.set_password("Password123!")
    recruiter.role = "recruiter"
    recruiter.save()

    candidate, _ = User.objects.get_or_create(
        email="candidate@example.com",
        defaults={"first_name": "Alex", "last_name": "Candidate", "role": "candidate", "is_active": True}
    )
    candidate.set_password("Password123!")
    candidate.role = "candidate"
    candidate.save()

    template, _ = InterviewTemplate.objects.get_or_create(
        title="Senior Full-Stack Engineer Interview",
        defaults={
            "description": "Standard E2E test template",
            "interview_type": "technical",
            "domain": "Full Stack Software Engineering",
            "difficulty": "medium",
            "question_count": 4,
            "duration_minutes": 30,
            "created_by": recruiter,
            "is_active": True,
        }
    )

    invitation = InterviewInvitation.objects.create(
        token="e2e-token-happy-path",
        recruiter=recruiter,
        candidate_email=candidate.email,
        candidate=candidate,
        template=template,
        message="Please complete your technical assessment.",
        status=InvitationStatus.SENT,
        expires_at=timezone.now() + timedelta(days=7),
    )

    return {
        "recruiter_email": recruiter.email,
        "candidate_email": candidate.email,
        "template_id": str(template.id),
        "token": invitation.token,
        "invitation_id": str(invitation.id),
    }

def create_expired_invitation():
    recruiter = User.objects.get(email="recruiter@example.com")
    candidate = User.objects.get(email="candidate@example.com")
    template = InterviewTemplate.objects.first()

    invitation = InterviewInvitation.objects.create(
        token="e2e-token-expired",
        recruiter=recruiter,
        candidate_email=candidate.email,
        candidate=candidate,
        template=template,
        status=InvitationStatus.EXPIRED,
        expires_at=timezone.now() - timedelta(days=1),
    )
    return {"token": invitation.token, "id": str(invitation.id)}

def get_session_details(session_id=None, token=None):
    session = None
    if session_id:
        session = InterviewSession.objects.filter(pk=session_id).first()
    elif token:
        inv = InterviewInvitation.objects.filter(token=token).first()
        if inv and inv.session:
            session = inv.session

    if not session:
        return {"found": False}

    turns_count = session.turns.count()
    transcripts_count = session.transcript_turns.count()
    snapshots_count = FaceAssessmentSnapshot.objects.filter(session=session).count()

    return {
        "found": True,
        "id": str(session.id),
        "status": session.status,
        "started_at": session.started_at.isoformat() if session.started_at else None,
        "completed_at": session.completed_at.isoformat() if session.completed_at else None,
        "turns_count": turns_count,
        "transcripts_count": transcripts_count,
        "snapshots_count": snapshots_count,
        "candidate_email": session.candidate.email,
        "seed_topics_ready": session.seed_topics_ready,
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command specified"}))
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "reset":
        result = reset_test_data()
        print(json.dumps(result))
    elif cmd == "create_expired":
        result = create_expired_invitation()
        print(json.dumps(result))
    elif cmd == "get_session":
        arg = sys.argv[2] if len(sys.argv) > 2 else None
        if arg and len(arg) == 36 and "-" in arg:
            result = get_session_details(session_id=arg)
        else:
            result = get_session_details(token=arg)
        print(json.dumps(result))
    else:
        print(json.dumps({"error": f"Unknown command: {cmd}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
