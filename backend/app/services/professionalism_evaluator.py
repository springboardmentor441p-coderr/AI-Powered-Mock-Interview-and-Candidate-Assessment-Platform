"""
Professionalism Evaluator (15% overall weight).

Evaluates response organization, relevance, tone, and respect for interview pacing.
"""

from app.models.interview_models import EvaluationDimension


class ProfessionalismEvaluator:
    """Evaluates whether an answer is structured, relevant, and professional."""

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
        cleaned = (answer or "").strip()
        words = cleaned.split()

        if len(words) < 5:
            return EvaluationDimension(
                score=30.0,
                reasoning="Response was too brief to demonstrate professional structure.",
            )

        base_score = 72.0
        lowered = cleaned.lower()

        if any(marker in lowered for marker in ("first", "second", "finally", "for example")):
            base_score += 8.0
        if any(marker in lowered for marker in ("thank you", "appreciate", "respectfully")):
            base_score += 5.0
        if len(words) > 350:
            base_score -= 8.0
        if response_time_seconds and response_time_seconds > 180:
            base_score -= 5.0

        base_score = max(10.0, min(100.0, base_score))

        if llm_score is not None:
            scaled_llm = llm_score * 10.0 if llm_score <= 10.0 else llm_score
            score = round(0.6 * scaled_llm + 0.4 * base_score, 1)
            reasoning = llm_reason or "Professionalism blended with the LLM evaluation."
        else:
            score = round(base_score, 1)
            reasoning = "Professionalism estimated from structure, relevance, tone, and pacing."

        return EvaluationDimension(score=score, reasoning=reasoning)
