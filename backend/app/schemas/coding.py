from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any


class CodingChallengeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    difficulty: str
    domain: str
    language: str
    starter_code: str


class SubmitCodeRequest(BaseModel):
    challenge_id: int
    code: str
    language: str


class CodingSubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    challenge_id: int
    status: str
    score: float
    feedback: str
    complexity: str
    code_quality: str
    created_at: datetime
