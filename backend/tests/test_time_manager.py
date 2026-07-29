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
