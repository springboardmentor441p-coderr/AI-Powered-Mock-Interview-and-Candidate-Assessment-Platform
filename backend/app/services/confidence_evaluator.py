"""
Confidence Evaluator (25% overall weight).

Evaluates:
- Speaking fluency & flow
- Hesitation & filler word frequency
- Pause patterns and uncertainty markers
- Assertive language vs timid/uncertain phrasing
- Voice stability (when audio metadata is available)
"""

import logging
import re
from app.models.interview_models import EvaluationDimension
from app.services.speech_analyzer import SpeechAnalyzer

logger = logging.getLogger(__name__)

UNCERTAINTY_PHRASES: set[str] = {
    "i guess", "maybe", "i think so", "not sure", "dunno", "kind of",
    "sort of", "i don't know", "probably", "i suppose", "possibly"
}

CERTAINTY_PHRASES: set[str] = {
    "i designed", "i built", "i led", "specifically", "the reason is",
    "in my experience", "i am confident", "definitely", "achieved", "implemented"
}


class ConfidenceEvaluator:
    """
    Evaluates candidate confidence from verbal patterns, audio timing, and language indicators.
    """

    @classmethod
    def evaluate(
        cls,
        *,
        question: str,
        answer: str,
        response_time_seconds: float = 0.0,
        audio_metadata: dict | None = None,
        llm_score: float | None = None,
        llm_reason: str | None = None,
    ) -> EvaluationDimension:
        """
        Evaluate candidate confidence level.

        Returns EvaluationDimension (score: 0-100, reasoning: str).
        """
        cleaned_text = (answer or "").strip()
        text_lower = cleaned_text.lower()
        metrics = SpeechAnalyzer.analyze_transcript(answer, response_time_seconds)
        word_count = metrics["word_count"]

        if word_count < 5:
            return EvaluationDimension(
                score=35.0,
                reasoning="Extremely brief response indicates hesitation or lack of confidence.",
            )

        # Baseline score calculation
        base_score = 75.0

        # Filler word penalty
        filler_freq = metrics["filler_frequency"]
        if filler_freq > 8.0:
            base_score -= 15.0
        elif filler_freq > 4.0:
            base_score -= 8.0

        # Hesitation / uncertainty count
        uncertainty_count = sum(
            1 for phrase in UNCERTAINTY_PHRASES if phrase in text_lower
        )
        base_score -= min(20.0, uncertainty_count * 6.0)

        # Assertive certainty bonus
        certainty_count = sum(
            1 for phrase in CERTAINTY_PHRASES if phrase in text_lower
        )
        base_score += min(15.0, certainty_count * 4.0)

        # Audio timing / stability check if voice features available
        if audio_metadata and isinstance(audio_metadata, dict):
            confidence_prob = audio_metadata.get("confidence", 0.85)
            if isinstance(confidence_prob, (int, float)):
                base_score = 0.7 * base_score + 0.3 * (confidence_prob * 100.0)

        base_score = max(10.0, min(100.0, base_score))

        # Blend with LLM evaluation if present
        if llm_score is not None:
            scaled_llm = llm_score * 10.0 if llm_score <= 10.0 else llm_score
            final_score = round(0.6 * scaled_llm + 0.4 * base_score, 1)
            reasoning = (
                llm_reason
                or f"Demonstrated confidence rating of {final_score}/100 based on language tone, fluency, and response flow."
            )
        else:
            final_score = round(base_score, 1)
            reasoning = (
                f"Confidence estimated from fluency metrics: filler frequency {filler_freq}%, "
                f"uncertainty markers: {uncertainty_count}, assertive phrases: {certainty_count}."
            )

        return EvaluationDimension(
            score=final_score,
            reasoning=reasoning,
        )
