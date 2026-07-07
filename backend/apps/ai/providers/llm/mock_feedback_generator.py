from typing import Any

from apps.ai.providers.llm.interfaces import FeedbackResult, IFeedbackGenerationProvider

_LEARNING_RESOURCES = {
    "communication": [
        "Toastmasters International - public speaking practice",
        "Grammarly - real-time grammar feedback while writing",
    ],
    "confidence": [
        "Amy Cuddy's TED talk on body language and presence",
        "Daily mock-interview practice with peer feedback",
    ],
    "technical_relevance": [
        "LeetCode / HackerRank for structured problem practice",
        "System design primer (GitHub) for architecture questions",
    ],
    "professionalism": [
        "STAR method guide for structuring behavioral answers",
        "Time-boxing practice using a visible countdown timer",
    ],
}


class MockFeedbackGenerator(IFeedbackGenerationProvider):
    """
    Rule-based feedback generator driven by the numeric scores already
    computed by the scoring engine. Deterministic and dependency-free,
    making it suitable as the default in dev/test and as a safe
    fallback if the LLM-backed adapter is unavailable.
    """

    def generate(self, session_context: dict[str, Any]) -> FeedbackResult:
        scores: dict[str, float] = session_context.get("scores", {})
        analysis: dict[str, Any] = session_context.get("analysis", {})

        strengths: list[str] = []
        weaknesses: list[str] = []
        suggestions: list[str] = []
        recommendations: list[str] = []
        resources: list[str] = []

        for category, score in scores.items():
            label = category.replace("_", " ")
            if score >= 75:
                strengths.append(f"Strong {label} performance ({score:.0f}/100).")
            elif score < 60:
                weaknesses.append(f"{label.capitalize()} needs improvement ({score:.0f}/100).")
                suggestions.append(self._suggestion_for(category))
                recommendations.append(self._recommendation_for(category))
                resources.extend(_LEARNING_RESOURCES.get(category, []))

        if analysis.get("filler_word_count", 0) > 5:
            weaknesses.append("Frequent use of filler words (um, uh, like) reduces clarity.")
            suggestions.append("Practice pausing silently instead of using filler words when collecting your thoughts.")

        if not strengths:
            strengths.append("Completed the full interview session, demonstrating commitment to practice.")
        if not weaknesses:
            weaknesses.append("No significant weaknesses detected - keep practicing to maintain consistency.")

        return FeedbackResult(
            strengths=strengths,
            weaknesses=weaknesses,
            improvement_suggestions=suggestions or ["Continue practicing under timed, realistic conditions."],
            practice_recommendations=recommendations or ["Schedule one more mock interview this week."],
            learning_resources=list(dict.fromkeys(resources)) or ["General interview preparation guide"],
        )

    @staticmethod
    def _suggestion_for(category: str) -> str:
        return {
            "communication": "Slow down slightly and structure answers with a clear beginning, middle, and end.",
            "confidence": "Maintain steady eye contact with the camera and sit upright to project confidence.",
            "technical_relevance": "Anchor answers in specific technologies and quantifiable outcomes from past work.",
            "professionalism": "Keep responses within the allotted time and organize them using the STAR method.",
        }.get(category, "Review this area and practice with targeted mock questions.")

    @staticmethod
    def _recommendation_for(category: str) -> str:
        return {
            "communication": "Record yourself answering 3 questions and review filler-word frequency.",
            "confidence": "Practice in front of a mirror or webcam to build comfort with self-presentation.",
            "technical_relevance": "Re-attempt 5 technical questions in your target domain this week.",
            "professionalism": "Run a timed mock interview and track how closely you stay within each time box.",
        }.get(category, "Schedule focused practice sessions on this rubric category.")
