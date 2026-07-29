"""
Scoring Engine for the Time-Aware Adaptive AI Interview Engine.

Formula:
Overall Score = (Communication * 0.30) + (Technical * 0.30) + (Confidence * 0.25) + (Professionalism * 0.15)

Performance Ratings:
90 - 100: Excellent
75 - 89:  Good
60 - 74:  Average
40 - 59:  Needs Improvement
Below 40: Poor
"""

import logging
from typing import Any

from app.models.interview_models import (
    AnswerEvaluation,
    EvaluationDimension,
    InterviewSession,
    QuestionEvaluation,
)
from app.services.communication_evaluator import CommunicationEvaluator
from app.services.confidence_evaluator import ConfidenceEvaluator
from app.services.professionalism_evaluator import ProfessionalismEvaluator
from app.services.technical_evaluator import TechnicalEvaluator

logger = logging.getLogger(__name__)


class ScoringEngine:
    """
    Computes overall weighted scores, performance ratings, and maintains continuous evaluation records.
    """

    COMMUNICATION_WEIGHT: float = 0.30
    TECHNICAL_WEIGHT: float = 0.30
    CONFIDENCE_WEIGHT: float = 0.25
    PROFESSIONALISM_WEIGHT: float = 0.15

    @classmethod
    def calculate_overall_score(
        cls,
        *,
        communication: float,
        technical: float,
        confidence: float,
        professionalism: float,
    ) -> float:
        """
        Calculate weighted overall score (0.0 - 100.0).
        """
        score = (
            (communication * cls.COMMUNICATION_WEIGHT)
            + (technical * cls.TECHNICAL_WEIGHT)
            + (confidence * cls.CONFIDENCE_WEIGHT)
            + (professionalism * cls.PROFESSIONALISM_WEIGHT)
        )
        return round(max(0.0, min(100.0, score)), 1)

    @classmethod
    def classify_performance_rating(cls, score: float) -> str:
        """
        Map a numeric overall score (0-100) to a performance rating category.
        """
        if score >= 90.0:
            return "Excellent"
        if score >= 75.0:
            return "Good"
        if score >= 60.0:
            return "Average"
        if score >= 40.0:
            return "Needs Improvement"
        return "Poor"

    @classmethod
    def evaluate_question(
        cls,
        *,
        session: InterviewSession,
        question: str,
        answer: str,
        response_time_seconds: float = 0.0,
        llm_raw_eval: dict[str, Any] | None = None,
    ) -> QuestionEvaluation:
        """
        Perform continuous evaluation of a candidate's answer.
        Combines individual dimension evaluators and computes overall score & rating.
        """
        llm_raw = llm_raw_eval or {}

        # Extract potential LLM preliminary scores (scaled 0-10 if returned by LLM)
        llm_tech = llm_raw.get("technical")
        llm_comm = llm_raw.get("communication")
        llm_conf = llm_raw.get("confidence")
        llm_prof = llm_raw.get("problem_solving") or llm_raw.get("professionalism")
        llm_reason = llm_raw.get("reason", "")
        needs_followup = bool(llm_raw.get("needs_followup", False))

        # Run dimension evaluators
        comm_eval = CommunicationEvaluator.evaluate(
            question=question,
            answer=answer,
            response_time_seconds=response_time_seconds,
            llm_score=llm_comm,
            llm_reason=llm_reason,
        )

        tech_eval = TechnicalEvaluator.evaluate(
            question=question,
            answer=answer,
            job_context=session.resume,
            llm_score=llm_tech,
            llm_reason=llm_reason,
        )

        conf_eval = ConfidenceEvaluator.evaluate(
            question=question,
            answer=answer,
            response_time_seconds=response_time_seconds,
            llm_score=llm_conf,
            llm_reason=llm_reason,
        )

        prof_eval = ProfessionalismEvaluator.evaluate(
            question=question,
            answer=answer,
            response_time_seconds=response_time_seconds,
            llm_score=llm_prof,
            llm_reason=llm_reason,
        )

        overall_score = cls.calculate_overall_score(
            communication=comm_eval.score,
            technical=tech_eval.score,
            confidence=conf_eval.score,
            professionalism=prof_eval.score,
        )

        rating = cls.classify_performance_rating(overall_score)

        return QuestionEvaluation(
            question_number=session.question_count,
            question=question,
            answer=answer,
            stage=session.current_stage,
            difficulty=session.difficulty,
            response_time_seconds=round(response_time_seconds, 1),
            communication=comm_eval,
            technical=tech_eval,
            confidence=conf_eval,
            professionalism=prof_eval,
            overall_score=overall_score,
            performance_rating=rating,
            needs_followup=needs_followup,
        )

    @classmethod
    def update_session_scores(
        cls,
        session: InterviewSession,
        evaluation: QuestionEvaluation,
    ) -> None:
        """
        Record question evaluation and update running accumulators in session.
        """
        session.question_evaluations.append(evaluation)

        # Update running accumulators
        scores = session.scores
        scores.communication += evaluation.communication.score
        scores.technical += evaluation.technical.score
        scores.confidence += evaluation.confidence.score
        scores.professionalism += evaluation.professionalism.score
        scores.total_evaluations += 1

        # Update session live metrics
        session.metrics.answered_questions = len(session.question_evaluations)
        if evaluation.needs_followup:
            session.metrics.followup_questions += 1
