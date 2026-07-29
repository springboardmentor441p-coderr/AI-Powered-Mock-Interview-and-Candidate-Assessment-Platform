"""
Technical Relevance & Accuracy Evaluator (30% overall weight).

Evaluates:
- Technical accuracy & core domain knowledge
- Keyword relevance matching job role & question
- Problem-solving capability & logical reasoning
- Depth of technical explanation & answer completeness
"""

import logging
from typing import Any

from app.models.interview_models import EvaluationDimension

logger = logging.getLogger(__name__)


class TechnicalEvaluator:
    """
    Evaluates technical domain accuracy and depth of candidate responses.
    """

    @classmethod
    def evaluate(
        cls,
        *,
        question: str,
        answer: str,
        job_context: dict[str, Any] | None = None,
        llm_score: float | None = None,
        llm_reason: str | None = None,
    ) -> EvaluationDimension:
        """
        Evaluate technical content of the candidate's response.

        Returns EvaluationDimension (score: 0-100, reasoning: str).
        """
        cleaned_answer = (answer or "").strip()
        word_count = len(cleaned_answer.split())

        if word_count < 5:
            return EvaluationDimension(
                score=20.0,
                reasoning="Candidate provided insufficient technical detail to evaluate domain knowledge.",
            )

        # Domain keyword matching check against job_context
        key_skills = []
        if job_context and isinstance(job_context.get("key_skills"), list):
            key_skills = [str(k).lower() for k in job_context["key_skills"]]

        matched_keywords = [
            skill for skill in key_skills if skill in cleaned_answer.lower()
        ]
        keyword_bonus = min(20.0, len(matched_keywords) * 5.0)

        # Baseline heuristic score
        base_score = 65.0 + keyword_bonus
        if word_count >= 50:
            base_score += 10.0
        elif word_count < 15:
            base_score -= 15.0

        base_score = max(10.0, min(100.0, base_score))

        # Combine with LLM score if provided
        if llm_score is not None:
            scaled_llm = llm_score * 10.0 if llm_score <= 10.0 else llm_score
            final_score = round(0.7 * scaled_llm + 0.3 * base_score, 1)
            reasoning = (
                llm_reason
                or f"Technical content evaluated with score {final_score}/100. Matched domain skills: {', '.join(matched_keywords) or 'General domain principles'}."
            )
        else:
            final_score = round(base_score, 1)
            reasoning = (
                f"Technical relevance score based on response depth ({word_count} words) "
                f"and domain keyword matching ({len(matched_keywords)} skills matched)."
            )

        return EvaluationDimension(
            score=final_score,
            reasoning=reasoning,
        )
