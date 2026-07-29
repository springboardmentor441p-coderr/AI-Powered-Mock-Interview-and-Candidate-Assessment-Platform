from app.models.interview_models import InterviewSession
from app.services.strategy_engine import InterviewStrategyEngine, StrategyDecision


def test_strategy_engine_stages():
    tech_stages = InterviewStrategyEngine.get_stages("technical")
    hr_stages = InterviewStrategyEngine.get_stages("hr")

    assert "WARM_UP" in tech_stages
    assert "TECHNICAL" in tech_stages
    assert "CLOSING" in tech_stages
    assert "HR_CORE" in hr_stages


def test_strategy_engine_decisions():
    session = InterviewSession(
        session_id="test-strat-123",
        candidate_name="Bob",
        job_role="DevOps Engineer",
        resume={},
        interview_duration=30,
    )

    decision_info = InterviewStrategyEngine.evaluate_next_action(session)
    assert "decision" in decision_info
    assert decision_info["target_difficulty"] in ["Easy", "Medium", "Hard"]
