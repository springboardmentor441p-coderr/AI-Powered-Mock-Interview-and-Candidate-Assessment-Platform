from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str
    full_name: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str
    role: str = "candidate"  # candidate, recruiter, admin

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Profile Schemas
class ProfileResponse(BaseModel):
    id: int
    user_id: int
    resume_path: Optional[str] = None
    parsed_skills: Optional[List[str]] = None
    parsed_experience: Optional[List[Dict[str, Any]]] = None
    education: Optional[List[Dict[str, Any]]] = None
    summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    parsed_skills: Optional[List[str]] = None
    parsed_experience: Optional[List[Dict[str, Any]]] = None
    education: Optional[List[Dict[str, Any]]] = None
    summary: Optional[str] = None

# Interview Template Schemas
class InterviewTemplateBase(BaseModel):
    title: str
    description: Optional[str] = None
    domain: str
    difficulty: str
    questions: List[str]

class InterviewTemplateCreate(InterviewTemplateBase):
    pass

class InterviewTemplateResponse(InterviewTemplateBase):
    id: int
    created_by_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Interview Answer Schemas
class InterviewAnswerCreate(BaseModel):
    question_id: int
    answer_text: str
    duration_seconds: float
    # Speech analysis statistics (can be calculated or passed from front-end)
    filler_word_count: int = 0
    wpm: int = 0
    confidence_pct: float = 0.0
    eye_contact_pct: float = 0.0
    transcript_confidence: float = 1.0

class InterviewAnswerResponse(BaseModel):
    id: int
    session_id: int
    question_id: int
    answer_text: str
    duration_seconds: float
    filler_word_count: int
    wpm: int
    confidence_pct: float
    eye_contact_pct: float
    transcript_confidence: float
    score: Optional[float] = None
    feedback_text: Optional[str] = None
    audio_path: Optional[str] = None

    class Config:
        from_attributes = True

# Interview Question Schemas
class InterviewQuestionResponse(BaseModel):
    id: int
    session_id: int
    question_text: str
    category: str
    order: int

    class Config:
        from_attributes = True

# Interview Session Schemas
class InterviewSessionCreate(BaseModel):
    domain: str
    difficulty: str
    template_id: Optional[int] = None

class InterviewSessionResponse(BaseModel):
    id: int
    candidate_id: int
    template_id: Optional[int] = None
    domain: str
    difficulty: str
    status: str
    total_score: Optional[float] = None
    communication_score: Optional[float] = None
    confidence_score: Optional[float] = None
    technical_score: Optional[float] = None
    professionalism_score: Optional[float] = None
    feedback: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InterviewSessionDetail(InterviewSessionResponse):
    questions: List[InterviewQuestionResponse]
    answers: List[InterviewAnswerResponse]

    class Config:
        from_attributes = True

# API Settings Schema
class ApiKeysSettings(BaseModel):
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
