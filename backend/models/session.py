"""
models/session.py — InterviewSession, InterviewQuestion, InterviewAnswer, SessionReport

One interview session contains many questions.
Each question gets one answer from the candidate.
After all answers, a SessionReport is generated with scores.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class InterviewSession(BaseModel):
    id: str = Field(alias="_id", default="")
    user_id: str
    interview_type: str
    domain: str
    difficulty: str
    status: str = "active"
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    rules_accepted_at: Optional[datetime] = None
    
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    scheduled_start: Optional[datetime] = None
    duration_minutes: int = 30
    
    question_count: int = 0  # We store count directly since relationships aren't magic anymore

    def to_dict(self):
        d = self.model_dump(by_alias=True)
        d["id"] = str(d.pop("_id", self.id))
        d["started_at"] = self.started_at.isoformat() if self.started_at else None
        d["ended_at"] = self.ended_at.isoformat() if self.ended_at else None
        d["rules_accepted_at"] = self.rules_accepted_at.isoformat() if self.rules_accepted_at else None
        d["scheduled_start"] = self.scheduled_start.isoformat() if self.scheduled_start else None
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


class InterviewQuestion(BaseModel):
    id: str = Field(alias="_id", default="")
    session_id: str
    question_number: int
    question_text: str
    expected_keywords: Optional[str] = None
    question_type: str
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


class InterviewAnswer(BaseModel):
    id: str = Field(alias="_id", default="")
    question_id: str
    session_id: str
    transcribed_text: str
    answer_duration: float = 0
    communication_score: float = 0
    technical_score: float = 0
    confidence_score: float = 0
    professionalism_score: float = 0
    filler_word_count: int = 0
    words_per_minute: float = 0
    ai_feedback: Optional[str] = None
    eye_contact_score: float = 0
    emotion_label: str = "neutral"
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


class IntegrityEvent(BaseModel):
    id: str = Field(alias="_id", default="")
    session_id: str
    event_type: str
    duration_seconds: float = 0
    description: Optional[str] = None
    severity: str = "medium"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    def to_dict(self):
        d = self.model_dump(by_alias=True)
        d["id"] = str(d.pop("_id", self.id))
        d["timestamp"] = self.timestamp.isoformat() if self.timestamp else None
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


class SessionReport(BaseModel):
    id: str = Field(alias="_id", default="")
    session_id: str
    user_id: str
    overall_score: float
    communication_score: float
    confidence_score: float
    technical_score: float
    professionalism_score: float
    rating: str
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    suggestions: Optional[str] = None
    total_questions: int = 0
    avg_filler_words: float = 0
    avg_words_per_min: float = 0
    avg_eye_contact: float = 0
    duration_minutes: float = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def to_dict(self):
        d = self.model_dump(by_alias=True)
        d["id"] = str(d.pop("_id", self.id))
        d["overall_score"] = round(self.overall_score, 1)
        d["communication_score"] = round(self.communication_score, 1)
        d["confidence_score"] = round(self.confidence_score, 1)
        d["technical_score"] = round(self.technical_score, 1)
        d["professionalism_score"] = round(self.professionalism_score, 1)
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
        if "user_id" in data:
            data["user_id"] = str(data["user_id"])
        return cls(**data)
