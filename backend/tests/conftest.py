"""Shared pytest fixtures.

Sets up an isolated, temporary SQLite database *before* the app is imported so
tests never touch a developer's real smarthire.db, and provides small helpers
for creating users and seeding a completed interview directly through the ORM
(bypassing the live conversational flow, which is out of scope here).
"""
import os
import tempfile
import uuid
from datetime import datetime, timedelta

os.environ.setdefault("DATABASE_URL", f"sqlite:///{tempfile.NamedTemporaryFile(suffix='.db', delete=False).name}")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("LLM_PROVIDER", "disabled")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Interview, InterviewProfile, InterviewQuestion, InterviewQuestionEvaluation  # noqa: E402

Base.metadata.create_all(bind=engine)


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def register_user(client):
    def _register(role: str = "candidate", full_name: str = "Test Candidate"):
        email = f"{uuid.uuid4().hex[:12]}@example.com"
        response = client.post("/auth/register", json={
            "full_name": full_name,
            "email": email,
            "password": "SuperSecret123",
            "role": role,
        })
        assert response.status_code == 201, response.text
        return response.json()
    return _register


@pytest.fixture()
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def seed_completed_interview(db_session):
    """Create a completed interview with real, persisted per-question evaluations."""
    def _seed(candidate_id: int, *, score_pairs: list[tuple[str, str]] | None = None):
        score_pairs = score_pairs or [
            ("Tell me about a project.", "I built an inventory API using FastAPI and PostgreSQL, added tests, and reduced latency by 30 percent."),
            ("What challenge did you face?", "The hardest part was designing the schema. I iterated with the team and validated it against real usage patterns."),
        ]
        interview = Interview(candidate_id=candidate_id, status="completed", current_question=len(score_pairs), created_at=datetime.utcnow() - timedelta(minutes=20), ended_at=datetime.utcnow())
        db_session.add(interview)
        db_session.flush()
        db_session.add(InterviewProfile(interview_id=interview.id, role_title="Backend Developer", mode="general", difficulty="Intermediate", resume_context="{}"))
        db_session.add(InterviewQuestion(interview_id=interview.id, order_number=0, question="Hi there! Thanks for joining today. Are you ready to begin?", answer_text="Yes, ready."))
        for index, (question, answer) in enumerate(score_pairs, start=1):
            q = InterviewQuestion(interview_id=interview.id, order_number=index, question=question, answer_text=answer)
            db_session.add(q)
            db_session.flush()
            db_session.add(InterviewQuestionEvaluation(
                question_id=q.id, score=80, relevance=80, technical_correctness=80,
                completeness=80, communication=80, confidence=80, examples=80,
                feedback="Solid, concrete answer.", suggested_better_answer="",
            ))
        db_session.commit()
        db_session.refresh(interview)
        return interview
    return _seed
