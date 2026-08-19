from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime

class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str
    role: Optional[str] = "candidate"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ResumeUploadResponse(BaseModel):
    id: int
    filename: str
    parsed_skills: List[str]
    parsed_experience: str
    parsed_education: str
    parsed_summary: str

class InterviewStartRequest(BaseModel):
    category: str # Technical, HR, Behavioral, Aptitude
    difficulty: str # Easy, Medium, Hard
    domain: str # Full Stack, Data Science, DevOps, HR
    num_questions: Optional[int] = 5

class AnswerSubmissionRequest(BaseModel):
    session_id: int
    question_index: int
    question_text: str
    candidate_answer: str
    transcript: Optional[str] = ""
    filler_word_count: Optional[int] = 0
    eye_contact_ratio: Optional[float] = 0.85
    words_per_minute: Optional[float] = 130.0

class FinishInterviewRequest(BaseModel):
    reason: Optional[str] = "completed" # completed, ended_by_candidate

class AssessmentReport(BaseModel):
    session_id: int
    communication_score: float
    confidence_score: float
    technical_score: float
    professionalism_score: float
    overall_score: float
    performance_rating: str
    filler_word_count: int
    words_per_minute: float
    eye_contact_ratio: float
    strengths: List[str]
    weaknesses: List[str]
    improvement_tips: List[str]
