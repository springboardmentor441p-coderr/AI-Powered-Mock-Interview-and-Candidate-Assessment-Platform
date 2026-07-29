"""
Communication Evaluator (30% overall weight).

Evaluates:
- Speech clarity & structure
- Grammar quality & vocabulary richness
- Speaking pace (WPM) & filler-word frequency
- Response completeness & conciseness
"""

import logging
from app.models.interview_models import EvaluationDimension
from app.services.speech_analyzer import SpeechAnalyzer

logger = logging.getLogger(__name__)


class CommunicationEvaluator:
    """
    Evaluates candidate communication effectiveness.
    """

    @classmethod
    def evaluate(
        cls,
        *,
        question: str,
        answer: str,
        response_time_seconds: float = 0.0,
        llm_score: float | None = None,
        llm_reason: str | None = None,
    ) -> EvaluationDimension:
        """
        Evaluate communication based on speech metrics and LLM evaluation.

        Returns EvaluationDimension (score: 0-100, reasoning: str).
        """
        metrics = SpeechAnalyzer.analyze_transcript(answer, response_time_seconds)
        word_count = metrics["word_count"]
        filler_freq = metrics["filler_frequency"]
        vocab_richness = metrics["vocabulary_richness"]

        if word_count < 5:
            return EvaluationDimension(
                score=30.0,
                reasoning="Response was extremely brief (fewer than 5 words) with minimal communication provided.",
            )

        # Baseline score computed from speech analytics (0 - 100)
        base_score = 75.0

        # Adjust for filler words
        if filler_freq > 10.0:
            base_score -= 20.0
        elif filler_freq > 5.0:
            base_score -= 10.0

        # Adjust for vocabulary richness
        if vocab_richness > 70.0:
            base_score += 10.0
        elif vocab_richness < 40.0:
            base_score -= 10.0

        # Adjust for length & structure
        if 20 <= word_count <= 250:
            base_score += 10.0
        elif word_count > 400:
            base_score -= 5.0  # Slightly verbose

        base_score = max(10.0, min(100.0, base_score))

        # Blend with LLM feedback if provided (60% LLM, 40% algorithmic speech analysis)
        if llm_score is not None:
            # Scale LLM score if given in 0-10 format
            scaled_llm = llm_score * 10.0 if llm_score <= 10.0 else llm_score
            final_score = round(0.6 * scaled_llm + 0.4 * base_score, 1)
            reasoning = (
                llm_reason
                or f"Clear delivery with filler frequency of {filler_freq}% and vocabulary richness of {vocab_richness:.1f}%."
            )
        else:
            final_score = round(base_score, 1)
            reasoning = (
                f"Communication analyzed: word count {word_count}, filler frequency {filler_freq}%, "
                f"vocabulary richness {vocab_richness:.1f}%."
            )

        return EvaluationDimension(
            score=final_score,
            reasoning=reasoning,
        )
