from django.db import transaction

from apps.ai.providers.llm.interfaces import IFeedbackGenerationProvider
from core.services import BaseService


class FeedbackService(BaseService):
    """Delegates feedback generation to the injected LLM provider."""

    def __init__(self, provider: IFeedbackGenerationProvider):
        super().__init__()
        self._provider = provider

    @transaction.atomic
    def generate(self, *, session):
        from apps.assessment.models.session_feedback import SessionFeedback

        analysis = getattr(session, "speech_analysis", None)
        score = getattr(session, "final_score", None)

        context = {
            "scores": score.breakdown.get("categories", {}) if score else {},
            "analysis": {
                "transcript": getattr(analysis, "transcript", ""),
                "filler_word_count": getattr(analysis, "filler_word_count", 0),
                "dominant_emotion": getattr(analysis, "dominant_emotion", ""),
            },
        }
        result = self._provider.generate(context)
        feedback, _ = SessionFeedback.objects.update_or_create(
            session=session,
            defaults={
                "strengths": result.strengths,
                "weaknesses": result.weaknesses,
                "improvement_suggestions": result.improvement_suggestions,
                "practice_recommendations": result.practice_recommendations,
                "learning_resources": result.learning_resources,
            },
        )
        self.logger.info("Feedback generated for session %s", session.id)
        return feedback
