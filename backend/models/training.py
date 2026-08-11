"""
models/training.py — TrainingDataPoint
Stores every (question, answer, scores) row for ML model training.
The ML model learns from these rows to predict scores for new answers.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class TrainingDataPoint(BaseModel):
    id: str = Field(alias="_id", default="")
    session_id: str
    question_text: str
    answer_text: str
    interview_type: str
    domain: str
    difficulty: str
    
    communication_score: float
    technical_score: float
    confidence_score: float
    professionalism_score: float
    overall_score: float

    word_count: int = 0
    filler_word_count: int = 0
    words_per_minute: float = 0
    answer_duration: float = 0

    source: str = "gpt_evaluated"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def to_dict(self):
        d = self.model_dump(by_alias=True)
        d["id"] = str(d.pop("_id", self.id))
        d["created_at"] = self.created_at.isoformat() if self.created_at else None
        return d
    
    @classmethod
    def from_mongo(cls, data: dict):
        if not data:
            return None
        if "_id" in data:
            data["_id"] = str(data["_id"])
        if "session_id" in data:
            data["session_id"] = str(data["session_id"])
        return cls(**data)
