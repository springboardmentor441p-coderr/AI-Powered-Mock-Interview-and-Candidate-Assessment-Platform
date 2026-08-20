from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from .models import Role

class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Role = Role.candidate
class LoginRequest(BaseModel): email: EmailStr; password: str
class UserOut(BaseModel):
    id: int; full_name: str; email: EmailStr; role: Role
    model_config = {"from_attributes": True}
class TokenOut(BaseModel): access_token: str; token_type: str = "bearer"; user: UserOut
class RoleUpdate(BaseModel): role: Role
class ResumeOut(BaseModel):
    id: int; original_name: str; status: str; uploaded_at: datetime
    model_config = {"from_attributes": True}

class JobMatchRequest(BaseModel):
    job_description: str = Field(min_length=30, max_length=12000)

class JobMatchOut(BaseModel):
    resume_name: str
    detected_skills: list[str]
    matched_skills: list[str]
    missing_skills: list[str]
    match_score: int
    candidate_name: str = ""
    suggested_role: str = ""
    projects: list[str] = []
    experience: str = ""
    technologies: list[str] = []

class InterviewStartRequest(BaseModel):
    role_title: str = Field(default="your target role", min_length=2, max_length=120)
    duration_minutes: int = Field(default=10, ge=10, le=30)
    mode: str = Field(default="general", pattern="^(general|resume)$")
    interview_type: str = Field(default="Technical", pattern="^(Technical|HR|Behavioural)$")
    difficulty: str = Field(default="Intermediate", pattern="^(Beginner|Intermediate|Advanced)$")
    experience_level: str = Field(default="", max_length=60)

class InterviewQuestionOut(BaseModel):
    id: int; order_number: int; question: str; answer_text: str | None = None
    model_config = {"from_attributes": True}

class InterviewOut(BaseModel):
    id: int; status: str; current_question: int; created_at: datetime; ended_at: datetime | None = None
    duration_minutes: int = 10
    questions: list[InterviewQuestionOut]
    detected_skills: list[str] = []
    target_questions: int = 7
    model_config = {"from_attributes": True}

class AnswerRequest(BaseModel):
    answer_text: str = Field(min_length=1, max_length=8000)

class ConversationTurnRequest(BaseModel):
    transcript: str = Field(min_length=1, max_length=8000)

class ConversationAdvanceRequest(BaseModel):
    remaining_seconds: int | None = Field(default=None, ge=0, le=1800)

class ConversationTurnOut(BaseModel):
    interview: InterviewOut
    completed: bool
    status_message: str
    accepted: bool
    follow_up_required: bool = False
    acknowledgement: str = ""

class FeedbackOut(BaseModel):
    score: int | None; answered_questions: int; total_questions: int
    strengths: list[str]; improvements: list[str]; note: str
    communication: int = 0
    technical_knowledge: int = 0
    confidence: int = 0
    problem_solving: int = 0
    recommended_topics: list[str] = []
    question_breakdown: list[dict] = []

class AssessmentOut(BaseModel):
    interview_id: int; status: str; created_at: datetime; ended_at: datetime | None = None
    score: int | None = None; answered_questions: int; total_questions: int
    candidate_id: int | None = None; candidate_name: str | None = None; candidate_email: EmailStr | None = None
    communication: int | None = None
    technical_knowledge: int | None = None
    confidence: int | None = None
    problem_solving: int | None = None

class CandidateAnalyticsOut(BaseModel):
    interviews_completed: int
    average_score: int | None = None
    best_score: int | None = None
    communication_score: int | None = None
    confidence_score: int | None = None
    technical_relevance_score: int | None = None
    problem_solving_score: int | None = None
    performance_trend: list[dict] = []
    recent_history: list[AssessmentOut] = []
    strengths: list[str] = []
    weaknesses: list[str] = []
    recommendations: list[str] = []

class NotificationOut(BaseModel):
    id: int; type: str; title: str; message: str; is_read: bool; created_at: datetime
    interview_id: int | None = None
    model_config = {"from_attributes": True}

class UltravoxCallOut(BaseModel):
    call_id: str
    join_url: str
