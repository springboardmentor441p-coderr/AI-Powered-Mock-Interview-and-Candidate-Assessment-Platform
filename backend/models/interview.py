"""
Interview session, questions, responses, and scores.
One InterviewSession → many Questions → each Question has one Response → one Score.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class InterviewSession(BaseModel):
    id: str = Field(alias="_id", default="")
    user_id: str
    interview_type: str
    domain: str
    difficulty: str
    status: str = "active"
    total_questions: int = 10
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None

    def to_dict(self):
        d = self.model_dump(by_alias=True)
        d["id"] = str(d.pop("_id", self.id))
        d["started_at"] = self.started_at.isoformat() if self.started_at else None
        d["ended_at"] = self.ended_at.isoformat() if self.ended_at else None
        return d
        
    @classmethod
    def from_mongo(cls, data: dict):
        if not data:
            return None
        if "_id" in data:
            data["_id"] = str(data["_id"])
        if "user_id" in data:
            data["user_id"] = str(data["user_id"])
        return cls(**data)


class Question(BaseModel):
    id: str = Field(alias="_id", default="")
    session_id: str
    question_number: int
    question_text: str
    expected_keywords: Optional[str] = None
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


class Response(BaseModel):
    id: str = Field(alias="_id", default="")
    question_id: str
    session_id: str
    transcript: Optional[str] = None
    speech_features: Optional[Dict[str, Any]] = None
    vision_features: Optional[Dict[str, Any]] = None
    answer_score: Optional[float] = None
    ai_feedback: Optional[str] = None
    answered_at: datetime = Field(default_factory=datetime.utcnow)

    def to_dict(self):
        d = self.model_dump(by_alias=True)
        d["id"] = str(d.pop("_id", self.id))
        d["answered_at"] = self.answered_at.isoformat() if self.answered_at else None
        return d
        
    @classmethod
    def from_mongo(cls, data: dict):
        if not data:
            return None
        if "_id" in data:
            data["_id"] = str(data["_id"])
        if "question_id" in data:
            data["question_id"] = str(data["question_id"])
        if "session_id" in data:
            data["session_id"] = str(data["session_id"])
        return cls(**data)


class SessionScore(BaseModel):
    id: str = Field(alias="_id", default="")
    session_id: str
    user_id: str
    communication_score: float = 0
    confidence_score: float = 0
    technical_score: float = 0
    professionalism_score: float = 0
    overall_score: float = 0
    rating: str = ""
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    suggestions: Optional[str] = None
    scored_at: datetime = Field(default_factory=datetime.utcnow)

    def to_dict(self):
        d = self.model_dump(by_alias=True)
        d["id"] = str(d.pop("_id", self.id))
        d["scored_at"] = self.scored_at.isoformat() if self.scored_at else None
        return d
        
    @classmethod
    def from_mongo(cls, data: dict):
        if not data:
            return None
        if "_id" in data:
            data["_id"] = str(data["_id"])
        if "session_id" in data:
            data["session_id"] = str(data["session_id"])
        if "user_id" in data:
            data["user_id"] = str(data["user_id"])
        return cls(**data)
