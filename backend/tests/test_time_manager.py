from datetime import datetime, timedelta, timezone

from app.models.interview_models import InterviewSession
from app.services.time_manager import TimeManager


def test_time_manager_calculation():
    session = InterviewSession(
        session_id="test-time-123",
        candidate_name="Alice",
        job_role="Software Engineer",
        resume={},
        interview_duration=30,
    )

    timing = TimeManager.calculate_timing(session)

    assert timing["remaining_seconds"] <= 1800.0
    assert timing["remaining_seconds"] > 1750.0
    assert timing["elapsed_seconds"] >= 0.0
    assert TimeManager.get_time_mode(timing["remaining_seconds"]) == "DETAILED"
    assert not TimeManager.is_time_expired(session)


def test_time_manager_modes():
    assert TimeManager.get_time_mode(500) == "DETAILED"
    assert TimeManager.get_time_mode(300) == "CONCISE"
    assert TimeManager.get_time_mode(100) == "WRAP_UP"


def test_processing_pause_is_excluded_from_elapsed_time():
    session = InterviewSession(
        session_id="paused-session",
        candidate_name="Candidate",
        job_role="Developer",
        resume={},
        interview_start_time=datetime.now(timezone.utc) - timedelta(seconds=30),
    )

    TimeManager.pause(session)
    frozen_remaining = TimeManager.calculate_timing(session)["remaining_seconds"]
    original_start = session.interview_start_time
    session.processing_started_at -= timedelta(seconds=5)
    TimeManager.resume(session)

    assert session.processing_started_at is None
    assert session.interview_start_time >= original_start + timedelta(seconds=5)
    assert (
        TimeManager.calculate_timing(session)["remaining_seconds"]
        >= frozen_remaining - 1
    )
