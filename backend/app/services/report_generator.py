"""
Report Generator.

Assembles comprehensive structured InterviewReport objects for frontend consumption
and dashboard analytics (Skill Trends, Communication/Technical/Confidence Trends, Weak Areas, Candidate Ranking).
"""

import logging
from typing import Any

from app.models.interview_models import InterviewReport, InterviewSession
from app.services.feedback_generator import FeedbackGenerator
from app.services.time_manager import TimeManager

logger = logging.getLogger(__name__)


class ReportGenerator:
    """
    Generates structured, dashboard-ready interview reports upon interview completion.
    """

    @classmethod
    def generate_report(cls, session: InterviewSession) -> InterviewReport:
        """
        Build full InterviewReport from session state and evaluation history.
        """
        # Scoring is deferred until report generation so live answer submission
        # does not wait for a separate evaluation LLM request.
        from app.services.interview_agent import InterviewAgent

        InterviewAgent().evaluate_pending_answers(session)
        timing = TimeManager.calculate_timing(session)
        evaluations = session.question_evaluations
        count = max(1, len(evaluations))

        # Category scores
        comm_score = round(sum(e.communication.score for e in evaluations) / count, 1)
        tech_score = round(sum(e.technical.score for e in evaluations) / count, 1)
        conf_score = round(sum(e.confidence.score for e in evaluations) / count, 1)
        prof_score = round(sum(e.professionalism.score for e in evaluations) / count, 1)

        overall_score = round(
            0.30 * comm_score + 0.30 * tech_score + 0.25 * conf_score + 0.15 * prof_score, 1
        )

        rating = "Not Evaluated" if not evaluations else "Poor"
        if evaluations and overall_score >= 90:
            rating = "Excellent"
        elif evaluations and overall_score >= 75:
            rating = "Good"
        elif evaluations and overall_score >= 60:
            rating = "Average"
        elif evaluations and overall_score >= 40:
            rating = "Needs Improvement"
        elif evaluations:
            rating = "Poor"

        # Generate feedback text & recommendations
        feedback = FeedbackGenerator.generate_feedback(session)

        # Build dashboard trends & analytics data
        comm_trend = [round(e.communication.score, 1) for e in evaluations]
        tech_trend = [round(e.technical.score, 1) for e in evaluations]
        conf_trend = [round(e.confidence.score, 1) for e in evaluations]
        prof_trend = [round(e.professionalism.score, 1) for e in evaluations]
        overall_trend = [round(e.overall_score, 1) for e in evaluations]

        weak_areas = []
        if comm_score < 70:
            weak_areas.append("Communication & Speech Clarity")
        if tech_score < 70:
            weak_areas.append("Technical Depth & Accuracy")
        if conf_score < 70:
            weak_areas.append("Confidence & Hesitation Reduction")
        if prof_score < 70:
            weak_areas.append("Response Organization & Time Management")
        if not evaluations:
            weak_areas = ["No answers submitted"]
        elif not weak_areas:
            weak_areas.append("Advanced Edge-Case Technical Handling")

        analytics: dict[str, Any] = {
            "performance_tracking": {
                "overall_score": overall_score,
                "rating": rating,
                "percentile_rank": min(99, int(overall_score * 0.95)),
            },
            "interview_history": [
                {
                    "session_id": session.session_id,
                    "date": session.interview_start_time.isoformat(),
                    "score": overall_score,
                    "job_role": session.job_role,
                }
            ],
            "skill_wise_analytics": {
                "communication": comm_score,
                "technical_relevance": tech_score,
                "confidence": conf_score,
                "professionalism": prof_score,
            },
            "communication_trend": comm_trend,
            "technical_trend": tech_trend,
            "confidence_trend": conf_trend,
            "overall_trend": overall_trend,
            "weak_areas": weak_areas,
            "performance_breakdown": {
                "communication": comm_score,
                "technical": tech_score,
                "confidence": conf_score,
                "professionalism": prof_score,
            },
            "candidate_ranking": {
                "tier": rating,
                "score": overall_score,
            },
            "answered_questions": len(evaluations),
        }

        candidate_info = {
            "name": session.candidate_name,
            "job_role": session.job_role,
            "skills": session.resume.get("skills", []),
        }

        duration_info = {
            "start_time": session.interview_start_time.isoformat(),
            "duration_minutes": session.interview_duration,
            "elapsed_seconds": int(timing["elapsed_seconds"]),
            "remaining_seconds": int(timing["remaining_seconds"]),
            "total_questions": session.question_count,
            "answered_questions": len(evaluations),
            "average_response_time": session.average_answer_time,
        }

        summary_text = (
            f"Candidate {session.candidate_name} completed a {session.interview_duration}-minute "
            f"{session.interview_type} mock interview for the {session.job_role} role, answering "
            f"{len(evaluations)} questions with an overall score of {overall_score}/100 ({rating})."
        )

        return InterviewReport(
            candidate_information=candidate_info,
            interview_type=session.interview_type,
            job_role=session.job_role,
            interview_duration=duration_info,
            questions_asked=session.questions_asked,
            question_wise_evaluation=session.question_evaluations,
            communication_score=comm_score,
            confidence_score=conf_score,
            technical_score=tech_score,
            professionalism_score=prof_score,
            overall_score=overall_score,
            performance_rating=rating,
            strengths=feedback.strengths,
            weaknesses=feedback.weaknesses,
            recommendations=feedback.suggested_improvements + feedback.practice_recommendations,
            learning_resources=feedback.learning_resources,
            interview_summary=summary_text,
            analytics=analytics,
        )
