from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any, Dict
from datetime import datetime

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    target_role: Optional[str] = "Software Engineer"
    experience_level: Optional[str] = "Mid-Level"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    target_role: str
    experience_level: str
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

# JD & Resume Schemas
class ResumeUploadRequest(BaseModel):
    filename: str
    raw_text: str

class JDUploadRequest(BaseModel):
    title: str
    company: Optional[str] = "Target Company"
    raw_text: str

class GenerateInterviewRequest(BaseModel):
    resume_text: str
    jd_text: str
    interview_type: Optional[str] = "Technical"
    experience_level: Optional[str] = "Mid-Level"
    num_questions: Optional[int] = 5
    target_role: Optional[str] = "Software Engineer"


class MatchAnalysisResponse(BaseModel):
    resume_skills: List[str]
    jd_skills: List[str]
    matched_skills: List[str]
    missing_skills: List[str]
    match_percentage: float
    analysis_summary: str

# Assessment Schemas
class CreateAssessmentRequest(BaseModel):
    jd_title: str
    skills: List[str]
    question_count: Optional[int] = 5

class AssessmentQuestionOut(BaseModel):
    id: int
    question_type: str
    title: str
    question_text: str
    options: Optional[List[str]] = None
    code_template: Optional[str] = None

class SubmitAssessmentAnswer(BaseModel):
    question_id: int
    user_submission: str

class AssessmentResultOut(BaseModel):
    session_id: int
    total_score: float
    status: str
    time_taken_seconds: int
    feedback: str
    question_breakdown: List[Dict[str, Any]]

# Interview Schemas
class CreateInterviewRequest(BaseModel):
    target_role: str
    resume_id: Optional[int] = None
    jd_id: Optional[int] = None
    avatar_personality: Optional[str] = "Professional Tech Lead"

class SubmitInterviewTelemetry(BaseModel):
    session_id: int
    question_id: int
    transcript: str
    eye_contact_ratio: float
    detected_emotions: Dict[str, float]
    voice_metrics: Dict[str, float]

class InterviewResultOut(BaseModel):
    session_id: int
    overall_score: float
    scores: Dict[str, float]
    transcript_history: List[Dict[str, Any]]
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]

class EvaluateSingleAnswerRequest(BaseModel):
    session_id: Optional[int] = None
    question_text: str
    expected_skills: Optional[List[str]] = []
    question_type: Optional[str] = "Technical"
    candidate_answer: str
    resume_context: Optional[str] = ""
    jd_context: Optional[str] = ""

class SaveInterviewRequest(BaseModel):
    user_id: Optional[int] = 1
    title: str
    avatar_personality: Optional[str] = "Professional Tech Lead"
    duration_seconds: Optional[int] = 300
    video_recording_url: Optional[str] = None
    questions: List[Dict[str, Any]]
    answers: List[Dict[str, Any]]
    score: Dict[str, float]
    proctor_strikes: Optional[int] = 0
    proctoring_metrics: Optional[Dict[str, Any]] = None
    termination_reason: Optional[str] = None
