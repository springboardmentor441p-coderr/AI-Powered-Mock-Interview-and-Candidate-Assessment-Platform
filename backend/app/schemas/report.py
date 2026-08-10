from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Any, Optional


class LearningPathModule(BaseModel):
    title: str
    description: str
    resources: list[str] = []


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    overall_score: float
    round1_score: float
    round2_score: float
    strengths: list[str] = []
    weaknesses: list[str] = []
    learning_path: list[LearningPathModule] = []
    hiring_recommendation: str
    summary_notes: str
    created_at: datetime
    
    # Candidate details
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    job_role: Optional[str] = None
    difficulty: Optional[str] = None
