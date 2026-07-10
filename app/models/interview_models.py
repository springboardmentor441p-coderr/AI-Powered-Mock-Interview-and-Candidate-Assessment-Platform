"""
Pydantic models for the AI Interview Engine.
"""

from typing import Any

from pydantic import BaseModel, Field


# ==========================================================
# Request Models
# ==========================================================

class StartInterviewRequest(BaseModel):
    """
    Request body for starting a new interview.
    """

    job_role: str = Field(..., min_length=2)
    resume: dict[str, Any]
    max_questions: int = Field(default=10, ge=5, le=50)


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


class SubmitAnswerResponse(BaseModel):
    session_id: str
    question_number: int
    current_stage: str
    current_topic: str
    question: str
    completed: bool


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

    resume: dict[str, Any]

    conversation: list[ConversationMessage] = Field(default_factory=list)

    questions_asked: list[str] = Field(default_factory=list)

    current_stage: str = "INTRODUCTION"

    current_topic: str = ""

    question_count: int = 0

    max_questions: int = 10

    completed: bool = False

    scores: InterviewScores = Field(default_factory=InterviewScores)


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

    strengths: list[str]

    weaknesses: list[str]

    communication: str

    technical_knowledge: str

    suggested_improvements: list[str]