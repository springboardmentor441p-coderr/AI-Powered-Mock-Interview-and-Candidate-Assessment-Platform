import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.interview.models import InterviewTemplate, InterviewInvitation, InvitationStatus
from apps.interview.models.interview_template import InterviewType, Difficulty

User = get_user_model()

# 1. Create Recruiter
recruiter, created = User.objects.get_or_create(
    email="recruiter@example.com",
    defaults={
        "first_name": "Sarah",
        "last_name": "Recruiter",
        "role": "recruiter",
        "is_active": True,
        "is_email_verified": True,
    }
)
recruiter.set_password("Password123!")
recruiter.role = "recruiter"
recruiter.save()
print(f"Recruiter: {recruiter.email} (id={recruiter.id})")

# 2. Create Candidate
candidate, created = User.objects.get_or_create(
    email="candidate@example.com",
    defaults={
        "first_name": "Alex",
        "last_name": "Candidate",
        "role": "candidate",
        "is_active": True,
        "is_email_verified": True,
    }
)
candidate.set_password("Password123!")
candidate.role = "candidate"
candidate.save()
print(f"Candidate: {candidate.email} (id={candidate.id})")

# 3. Create Interview Template
template, created = InterviewTemplate.objects.get_or_create(
    title="Senior Full-Stack Engineer Interview",
    defaults={
        "description": "Comprehensive evaluation covering system design, Python/Django backend, and React frontend.",
        "interview_type": InterviewType.TECHNICAL,
        "domain": "Full Stack Software Engineering",
        "difficulty": Difficulty.MEDIUM,
        "question_count": 4,
        "duration_minutes": 30,
        "created_by": recruiter,
        "is_active": True,
    }
)
print(f"Template: {template.title} (id={template.id})")

# 4. Create Invitation
invitation, created = InterviewInvitation.objects.get_or_create(
    token="demo-test-token-12345",
    defaults={
        "recruiter": recruiter,
        "candidate_email": candidate.email,
        "candidate": candidate,
        "template": template,
        "message": "Welcome Alex! Please complete your senior engineer assessment interview.",
        "status": InvitationStatus.SENT,
        "expires_at": timezone.now() + timedelta(days=7),
    }
)
# Ensure fresh status if existing
if not created and invitation.status in [InvitationStatus.EXPIRED, InvitationStatus.DECLINED, InvitationStatus.REVOKED]:
    invitation.status = InvitationStatus.SENT
    invitation.expires_at = timezone.now() + timedelta(days=7)
    invitation.save()

print(f"Invitation token: {invitation.token} (status={invitation.status})")
print("Seed data setup complete!")
