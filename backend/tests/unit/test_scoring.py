import pytest
from apps.assessment.services.scoring_service import rating_for_score


class TestRatingThresholds:
    @pytest.mark.parametrize("score,expected", [
        (95, "excellent"), (90, "excellent"), (89.9, "good"),
        (75, "good"), (74.9, "average"), (60, "average"),
        (59.9, "needs_improvement"), (40, "needs_improvement"),
        (39.9, "poor"), (0, "poor"),
    ])
    def test_rating_for_score(self, score, expected):
        assert rating_for_score(score) == expected


@pytest.mark.django_db
class TestScoringServiceWeights:
    def test_overall_uses_published_weights(self, candidate_user):
        from apps.interview.models import InterviewSession
        from apps.assessment.models import SpeechAnalysis
        from apps.assessment.services.scoring_service import ScoringService

        session = InterviewSession.objects.create(
            candidate=candidate_user, interview_type="technical",
            domain="backend", status=InterviewSession.Status.COMPLETED,
        )
        SpeechAnalysis.objects.create(
            session=session, status=SpeechAnalysis.Status.COMPLETED,
            transcript="Python Django REST APIs.",
            grammar_score=80, filler_word_count=0, clarity_score=80,
            completeness_score=80, speaking_pace_wpm=130,
            eye_contact_percentage=90, attention_score=90,
            engagement_score=90, confidence_score=85,
        )
        score = ScoringService().score_session(session=session)
        expected = round(
            score.communication * 0.30 + score.confidence * 0.25
            + score.technical_relevance * 0.30 + score.professionalism * 0.15, 2
        )
        assert score.overall == expected
        assert 0 <= score.overall <= 100
