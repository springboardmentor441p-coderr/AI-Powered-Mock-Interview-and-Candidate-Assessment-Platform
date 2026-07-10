"""
Interview scoring service.

Responsible for:
- Updating interview scores
- Calculating average scores
- Calculating overall score
"""

from app.models.interview_models import (
    AnswerEvaluation,
    InterviewScores,
)


class InterviewScorer:
    """
    Utility class for maintaining interview scores.
    """

    @staticmethod
    def update_scores(
        scores: InterviewScores,
        evaluation: AnswerEvaluation,
    ) -> None:
        """
        Update running interview scores using the latest evaluation.
        """

        scores.technical += evaluation.technical
        scores.communication += evaluation.communication
        scores.confidence += evaluation.confidence
        scores.problem_solving += evaluation.problem_solving

    @staticmethod
    def average_scores(
        scores: InterviewScores,
        total_questions: int,
    ) -> dict[str, float]:
        """
        Calculate average interview scores.

        Args:
            scores: Running score object.
            total_questions: Number of interview questions.

        Returns:
            Dictionary containing average scores.
        """

        total_questions = max(total_questions, 1)

        return {
            "technical": round(
                scores.technical / total_questions,
                2,
            ),
            "communication": round(
                scores.communication / total_questions,
                2,
            ),
            "confidence": round(
                scores.confidence / total_questions,
                2,
            ),
            "problem_solving": round(
                scores.problem_solving / total_questions,
                2,
            ),
        }

    @staticmethod
    def overall_score(
        average_scores: dict[str, float],
    ) -> float:
        """
        Calculate the overall interview score.
        """

        return round(
            (
                average_scores["technical"]
                + average_scores["communication"]
                + average_scores["confidence"]
                + average_scores["problem_solving"]
            )
            / 4,
            2,
        )

    @staticmethod
    def reset_scores() -> InterviewScores:
        """
        Create a new InterviewScores object.
        """

        return InterviewScores()

    @staticmethod
    def score_summary(
        scores: InterviewScores,
        total_questions: int,
    ) -> dict:
        """
        Return a complete score summary.
        """

        averages = InterviewScorer.average_scores(
            scores,
            total_questions,
        )

        return {
            **averages,
            "overall_score": InterviewScorer.overall_score(
                averages
            ),
        }