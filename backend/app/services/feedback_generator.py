"""
AI Feedback Generator.

Generates personalized, response-referenced interview feedback including:
- Candidate Strengths (referencing specific candidate answers)
- Key Weaknesses & Gaps
- Suggested Improvements
- Practice Recommendations
- Learning Resources
"""

import json
import logging
from typing import Any

from app.models.interview_models import InterviewFeedback, InterviewSession
from app.services.groq_service import chat_with_groq, parse_llm_json_response

logger = logging.getLogger(__name__)


class FeedbackGenerator:
    """
    Generates personalized feedback reports using candidate session history and evaluations.
    """

    @classmethod
    def generate_feedback(cls, session: InterviewSession) -> InterviewFeedback:
        """
        Generate structured feedback for the interview session.
        """
        evaluations = session.question_evaluations
        count = max(1, len(evaluations))

        # Calculate averages from question evaluations
        avg_comm = sum(e.communication.score for e in evaluations) / count if evaluations else 70.0
        avg_tech = sum(e.technical.score for e in evaluations) / count if evaluations else 70.0
        avg_conf = sum(e.confidence.score for e in evaluations) / count if evaluations else 70.0
        avg_prof = sum(e.professionalism.score for e in evaluations) / count if evaluations else 70.0

        overall_score = round(
            0.30 * avg_comm + 0.30 * avg_tech + 0.25 * avg_conf + 0.15 * avg_prof, 1
        )

        rating = "Good"
        if overall_score >= 90:
            rating = "Excellent"
        elif overall_score >= 75:
            rating = "Good"
        elif overall_score >= 60:
            rating = "Average"
        elif overall_score >= 40:
            rating = "Needs Improvement"
        else:
            rating = "Poor"

        # Build prompt payload with real question/answer samples
        qa_summary = []
        for ev in evaluations:
            qa_summary.append({
                "question": ev.question,
                "candidate_answer": ev.answer,
                "score": ev.overall_score,
                "stage": ev.stage,
            })

        system_prompt = """
You are a Senior Hiring Manager evaluating a candidate's mock interview performance.

Analyze the interview QA summary and scores.
Generate specific, personalized feedback referencing the candidate's ACTUAL answers.

Return ONLY valid JSON with this exact schema:
{
  "overall_score": 82.5,
  "performance_rating": "Good",
  "strengths": [
    "Specific strength referencing candidate answer...",
    "Another specific strength..."
  ],
  "weaknesses": [
    "Specific area of weakness based on responses...",
    "Another weakness..."
  ],
  "suggested_improvements": [
    "Actionable improvement tip...",
    "Actionable tip..."
  ],
  "practice_recommendations": [
    "Recommended practice exercise...",
    "Another exercise..."
  ],
  "learning_resources": [
    "Resource or documentation link/name...",
    "Another learning resource..."
  ],
  "communication": "Summary of candidate communication style...",
  "technical_knowledge": "Summary of technical domain depth..."
}
"""

        user_prompt = f"""
Candidate: {session.candidate_name}
Role: {session.job_role}
Interview Type: {session.interview_type}

Summary of Q&A Performance:
{json.dumps(qa_summary, indent=2)}

Scores:
- Communication: {avg_comm:.1f}
- Technical: {avg_tech:.1f}
- Confidence: {avg_conf:.1f}
- Professionalism: {avg_prof:.1f}
- Computed Overall: {overall_score:.1f} ({rating})

Generate personalized, response-grounded feedback in valid JSON format.
"""

        try:
            raw_response = chat_with_groq(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
                json_output=True,
            )

            feedback_json = parse_llm_json_response(raw_response)
            feedback_json["overall_score"] = overall_score
            feedback_json["performance_rating"] = rating

            return InterviewFeedback(**feedback_json)

        except Exception as exc:
            logger.warning("Fell back to rule-based feedback generation: %s", exc)
            return cls._build_fallback_feedback(session, overall_score, rating, avg_comm, avg_tech)

    @classmethod
    def _build_fallback_feedback(
        cls,
        session: InterviewSession,
        overall_score: float,
        rating: str,
        avg_comm: float,
        avg_tech: float,
    ) -> InterviewFeedback:
        """Fallback feedback builder when LLM service is unavailable."""
        strengths = [
            f"Demonstrated active engagement throughout the {session.job_role} interview.",
            f"Successfully responded to {session.question_count} interview questions across multiple stages.",
        ]
        weaknesses = [
            "Could provide more structured examples using the STAR method (Situation, Task, Action, Result).",
            "Technical explanations could benefit from deeper architectural detail and trade-off comparisons.",
        ]
        improvements = [
            "Practice elaborating on specific engineering decisions and metric outcomes.",
            "Reduce filler word usage to enhance communication clarity.",
        ]
        recommendations = [
            f"Conduct mock technical deep-dives focused on {session.job_role} core concepts.",
            "Practice 2-minute timed responses to improve conciseness under time constraints.",
        ]
        resources = [
            "Designing Data-Intensive Applications (Martin Kleppmann)",
            "System Design Interview Guide",
        ]

        return InterviewFeedback(
            overall_score=overall_score,
            performance_rating=rating,
            strengths=strengths,
            weaknesses=weaknesses,
            suggested_improvements=improvements,
            practice_recommendations=recommendations,
            learning_resources=resources,
            communication=f"Average communication score of {avg_comm:.1f}/100.",
            technical_knowledge=f"Average technical relevance score of {avg_tech:.1f}/100.",
        )
