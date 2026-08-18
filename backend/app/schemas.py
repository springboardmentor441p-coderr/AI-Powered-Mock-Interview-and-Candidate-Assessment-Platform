from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: str = "candidate"  # candidate | recruiter | admin


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Resume ----------
class ResumeOut(BaseModel):
    id: int
    filename: str
    skills: List[str]
    experience_years: float
    education: List[str]
    summary: str
    ats_score: Optional[float] = None
    ats_breakdown: Optional[dict] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ---------- Notifications ----------
class NotificationOut(BaseModel):
    id: int
    message: str
    notif_type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Interview ----------
class InterviewCreate(BaseModel):
    interview_type: str  # technical | hr | behavioral | aptitude
    difficulty: str = "medium"
    domain: str = "general"
    job_title: Optional[str] = None
    mode: str = "practice"  # practice | timed
    time_limit_seconds: Optional[int] = None
    resume_id: Optional[int] = None
    num_questions: int = 5


class QuestionOut(BaseModel):
    id: int
    order_index: int
    question_text: str
    category: str

    class Config:
        from_attributes = True


class InterviewOut(BaseModel):
    id: int
    interview_type: str
    difficulty: str
    domain: str
    job_title: Optional[str]
    mode: str
    time_limit_seconds: Optional[int]
    status: str
    created_at: datetime
    questions: List[QuestionOut]

    class Config:
        from_attributes = True


class AnswerSubmit(BaseModel):
    question_id: int
    answer_text: str
    time_taken_seconds: int = 0
    eye_contact_pct: float = 75.0
    confidence_signal: float = 70.0


class InterviewResult(BaseModel):
    id: int
    interview_type: str
    difficulty: str
    domain: str
    job_title: Optional[str]
    mode: str
    status: str
    communication_score: Optional[float]
    confidence_score: Optional[float]
    technical_score: Optional[float]
    professionalism_score: Optional[float]
    overall_score: Optional[float]
    rating: Optional[str]
    strengths: List[str]
    weaknesses: List[str]
    recommendations: List[str]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    total_interviews: int
    average_overall_score: float
    best_score: float
    latest_rating: Optional[str]
    score_trend: List[dict]
    skill_breakdown: dict
