"""
Pydantic models for the AI Interview Engine.
"""

from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field


# ==========================================================
# Request Models
# ==========================================================

class StartInterviewRequest(BaseModel):
    """
    Request body for starting a new interview.
    """

    job_role: str = Field(..., min_length=2)
    interview_type: Literal["technical", "hr"] = "technical"
    resume: dict[str, Any]
    max_questions: int = Field(default=10, ge=1, le=50)
    interview_duration: int = Field(default=15, ge=1, le=180)


class SubmitAnswerRequest(BaseModel):
    """
    Request body for submitting an answer.
    """

    session_id: str
    answer: str = Field(..., min_length=1)


class EndInterviewRequest(BaseModel):
    """
    Request body for ending an interview.
    """

    session_id: str


# ==========================================================
# Response Models
# ==========================================================

class StartInterviewResponse(BaseModel):
    """
    Response returned after creating an interview session.
    """

    session_id: str
    question: str
    current_stage: str = "WARM_UP"
    remaining_time: int = 900
    interview_progress: float = 0.0
    difficulty: str = "Easy"
    interview_status: str = "in_progress"


class SubmitAnswerResponse(BaseModel):
    session_id: str
    question_number: int
    current_stage: str
    current_topic: str
    question: str
    completed: bool
    remaining_time: int | None = None
    interview_progress: float | None = None
    difficulty: str | None = None
    interview_status: str | None = None


class EvaluationDimension(BaseModel):
    """One scored evaluation dimension for a candidate answer."""

    score: float = 0.0
    reasoning: str = ""


class QuestionEvaluation(BaseModel):
    """Structured evaluation for one interview question and answer."""

    question_number: int
    question: str
    answer: str
    stage: str
    difficulty: str = "Easy"
    response_time_seconds: float = 0.0
    communication: EvaluationDimension = Field(default_factory=EvaluationDimension)
    technical: EvaluationDimension = Field(default_factory=EvaluationDimension)
    confidence: EvaluationDimension = Field(default_factory=EvaluationDimension)
    professionalism: EvaluationDimension = Field(default_factory=EvaluationDimension)
    overall_score: float = 0.0
    performance_rating: str = "Good"
    needs_followup: bool = False


class InterviewMetrics(BaseModel):
    """Live metrics returned to the frontend during an interview."""

    remaining_time: int = 900
    interview_progress: float = 0.0
    answered_questions: int = 0
    followup_questions: int = 0
    average_response_time: float = 0.0


# ==========================================================
# Conversation Models
# ==========================================================

class ConversationMessage(BaseModel):
    """
    Represents one message in the interview conversation.
    """

    role: str
    content: str


# ==========================================================
# Score Models
# ==========================================================

class InterviewScores(BaseModel):
    """
    Running interview scores.
    """

    technical: float = 0.0
    communication: float = 0.0
    confidence: float = 0.0
    problem_solving: float = 0.0
    professionalism: float = 0.0
    total_evaluations: int = 0


# ==========================================================
# Interview Session
# ==========================================================

class InterviewSession(BaseModel):
    """
    Complete interview state stored in memory.
    """

    session_id: str

    candidate_name: str

    job_role: str

    interview_type: Literal["technical", "hr"] = "technical"

    resume: dict[str, Any]

    conversation: list[ConversationMessage] = Field(default_factory=list)

    questions_asked: list[str] = Field(default_factory=list)

    current_stage: str = "INTRODUCTION"

    current_topic: str = ""

    question_count: int = 0

    max_questions: int = 10

    interview_duration: int = 15

    interview_start_time: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    difficulty: str = "Easy"

    completed: bool = False

    scores: InterviewScores = Field(default_factory=InterviewScores)

    metrics: InterviewMetrics = Field(default_factory=InterviewMetrics)

    question_evaluations: list[QuestionEvaluation] = Field(default_factory=list)

    average_answer_time: float = 0.0


# ==========================================================
# LLM Evaluation Models
# ==========================================================

class AnswerEvaluation(BaseModel):
    """
    Structured response returned by the LLM after evaluating
    a candidate's answer.
    """

    quality: str

    technical: int

    communication: int

    confidence: int

    problem_solving: int

    needs_followup: bool

    reason: str


# ==========================================================
# Final Feedback
# ==========================================================

class InterviewFeedback(BaseModel):
    """
    Final interview report.
    """

    overall_score: float
    performance_rating: str = "Good"

    strengths: list[str]

    weaknesses: list[str]

    communication: str

    technical_knowledge: str

    suggested_improvements: list[str]

    practice_recommendations: list[str] = Field(default_factory=list)

    learning_resources: list[str] = Field(default_factory=list)


class InterviewReport(BaseModel):
    """Dashboard-ready final interview report."""

    candidate_information: dict[str, Any]
    interview_type: str
    job_role: str
    interview_duration: dict[str, Any]
    questions_asked: list[str]
    question_wise_evaluation: list[QuestionEvaluation]
    communication_score: float
    confidence_score: float
    technical_score: float
    professionalism_score: float
    overall_score: float
    performance_rating: str
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]
    learning_resources: list[str]
    interview_summary: str
    analytics: dict[str, Any]
