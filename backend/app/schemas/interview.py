from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Any, Optional


class StartInterviewRequest(BaseModel):
    job_role: str
    difficulty: str
    interview_type: str


class StartInterviewResponse(BaseModel):
    session_id: int
    current_round: int
    question_id: int
    question_text: str


class SubmitAnswerRequest(BaseModel):
    session_id: int
    question_id: int
    answer_text: str


class EvaluationMetricDetail(BaseModel):
    score: float
    technical_accuracy: float
    concept_understanding: float
    communication: float
    problem_solving: float
    confidence: float
    completeness: float
    practical_knowledge: float
    strengths: str
    weaknesses: str


class SubmitAnswerResponse(BaseModel):
    session_id: int
    question_id: int
    evaluation: EvaluationMetricDetail
    next_action: str  # NEXT_QUESTION, PROCEED_TO_ROUND_2, GENERATE_REPORT
    next_question: Optional[str] = None
    next_question_id: Optional[int] = None


class InterviewControlRequest(BaseModel):
    session_id: int
    action: str  # pause, resume, stop, end, retry, repeat


class InterviewQuestionResponse(BaseModel):
    question_id: int
    question_text: str
    round_number: int
    question_number: int


class InterviewHistoryListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_role: str
    difficulty: str
    interview_type: str
    status: str
    current_round: int
    cumulative_score: float
    created_at: datetime
    finished_at: Optional[datetime] = None
