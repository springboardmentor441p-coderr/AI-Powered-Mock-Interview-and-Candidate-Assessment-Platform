from app.models.interview_models import InterviewSession
from app.services.communication_evaluator import CommunicationEvaluator
from app.services.confidence_evaluator import ConfidenceEvaluator
from app.services.professionalism_evaluator import ProfessionalismEvaluator
from app.services.scoring_engine import ScoringEngine
from app.services.technical_evaluator import TechnicalEvaluator


def test_scoring_weights():
    # Formula: 0.30*comm + 0.30*tech + 0.25*conf + 0.15*prof
    score = ScoringEngine.calculate_overall_score(
        communication=100,
        technical=100,
        confidence=100,
        professionalism=100,
    )
    assert score == 100.0

    rating = ScoringEngine.classify_performance_rating(95.0)
    assert rating == "Excellent"

    rating_good = ScoringEngine.classify_performance_rating(80.0)
    assert rating_good == "Good"


def test_evaluators():
    comm = CommunicationEvaluator.evaluate(
        question="Tell me about yourself.",
        answer="I am a software engineer with 5 years of Python and FastAPI experience.",
        response_time_seconds=10.0,
    )
    assert comm.score > 0

    tech = TechnicalEvaluator.evaluate(
        question="How do you handle API security?",
        answer="I use JWT authentication, OAuth2, and HTTPS encryption.",
        job_context={"key_skills": ["python", "api"]},
    )
    assert tech.score > 0

    conf = ConfidenceEvaluator.evaluate(
        question="How confident are you in system design?",
        answer="I built scalable microservices handling 10k requests per second.",
        response_time_seconds=15.0,
    )
    assert conf.score > 0

    prof = ProfessionalismEvaluator.evaluate(
        question="Why apply to this role?",
        answer="Thank you for asking. My primary objective is to contribute to your team's goals.",
        response_time_seconds=12.0,
    )
    assert prof.score > 0
