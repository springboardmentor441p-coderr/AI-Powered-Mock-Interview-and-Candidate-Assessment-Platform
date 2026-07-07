"""
Seed a minimal set of demo data for local development.
Run with: python manage.py shell < scripts/seed_demo_data.py
"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from apps.identity.models import User
from apps.candidate.models import CandidateProfile
from apps.interview.models import InterviewTemplate

# Demo candidate
candidate, created = User.objects.get_or_create(
    email="demo.candidate@smarthire.ai",
    defaults={"first_name": "Demo", "last_name": "Candidate", "role": User.Role.CANDIDATE},
)
if created:
    candidate.set_password("demo1234!")
    candidate.save()
    CandidateProfile.objects.get_or_create(user=candidate)
    print(f"Created candidate: {candidate.email}")

# Demo recruiter
recruiter, created = User.objects.get_or_create(
    email="demo.recruiter@smarthire.ai",
    defaults={"first_name": "Demo", "last_name": "Recruiter", "role": User.Role.RECRUITER},
)
if created:
    recruiter.set_password("demo1234!")
    recruiter.save()
    print(f"Created recruiter: {recruiter.email}")

# Sample interview templates
templates = [
    {"title": "Python Backend Engineer", "interview_type": "technical", "domain": "Python / Django", "difficulty": "medium", "question_count": 5},
    {"title": "Behavioural Round", "interview_type": "behavioral", "domain": "General", "difficulty": "easy", "question_count": 5},
    {"title": "HR Screening", "interview_type": "hr", "domain": "General", "difficulty": "easy", "question_count": 5},
    {"title": "Data Science Technical", "interview_type": "technical", "domain": "Machine Learning / Python", "difficulty": "hard", "question_count": 7},
]
for t in templates:
    obj, created = InterviewTemplate.objects.get_or_create(title=t["title"], defaults={**t, "created_by": recruiter})
    if created:
        print(f"Created template: {obj.title}")

print("Seed complete.")
