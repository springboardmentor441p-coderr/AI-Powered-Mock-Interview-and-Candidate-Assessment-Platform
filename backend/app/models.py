from datetime import datetime
from enum import Enum
from sqlalchemy import DateTime, Enum as SqlEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

class Role(str, Enum):
    candidate = "candidate"; recruiter = "recruiter"; admin = "admin"

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(SqlEnum(Role), default=Role.candidate)
    resumes: Mapped[list["Resume"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    interviews: Mapped[list["Interview"]] = relationship(back_populates="candidate", cascade="all, delete-orphan")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user", cascade="all, delete-orphan")

class Resume(Base):
    __tablename__ = "resumes"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    original_name: Mapped[str] = mapped_column(String(255))
    stored_name: Mapped[str] = mapped_column(String(255), unique=True)
    content_type: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(40), default="uploaded")
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    owner: Mapped[User] = relationship(back_populates="resumes")


class Interview(Base):
    __tablename__ = "interviews"
    id: Mapped[int] = mapped_column(primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    resume_id: Mapped[int | None] = mapped_column(ForeignKey("resumes.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="in_progress")
    current_question: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    candidate: Mapped[User] = relationship(back_populates="interviews")
    questions: Mapped[list["InterviewQuestion"]] = relationship(back_populates="interview", cascade="all, delete-orphan", order_by="InterviewQuestion.order_number")
    profile: Mapped["InterviewProfile | None"] = relationship(back_populates="interview", cascade="all, delete-orphan", uselist=False)


class InterviewProfile(Base):
    """Session context retained separately so existing interview rows remain compatible."""
    __tablename__ = "interview_profiles"
    id: Mapped[int] = mapped_column(primary_key=True)
    interview_id: Mapped[int] = mapped_column(ForeignKey("interviews.id"), unique=True, index=True)
    role_title: Mapped[str] = mapped_column(String(120))
    mode: Mapped[str] = mapped_column(String(30), default="general")
    difficulty: Mapped[str] = mapped_column(String(30), default="Intermediate")
    experience_level: Mapped[str] = mapped_column(String(60), default="")
    resume_context: Mapped[str] = mapped_column(Text, default="{}")
    interview: Mapped[Interview] = relationship(back_populates="profile")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"
    id: Mapped[int] = mapped_column(primary_key=True)
    interview_id: Mapped[int] = mapped_column(ForeignKey("interviews.id"), index=True)
    order_number: Mapped[int] = mapped_column(Integer)
    question: Mapped[str] = mapped_column(Text)
    answer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    interview: Mapped[Interview] = relationship(back_populates="questions")
    evaluation: Mapped["InterviewQuestionEvaluation | None"] = relationship(back_populates="question", cascade="all, delete-orphan", uselist=False)


class InterviewQuestionEvaluation(Base):
    """Persisted evaluation for one answer without changing existing question rows."""
    __tablename__ = "interview_question_evaluations"
    id: Mapped[int] = mapped_column(primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("interview_questions.id"), unique=True, index=True)
    score: Mapped[int] = mapped_column(Integer, default=0)
    relevance: Mapped[int] = mapped_column(Integer, default=0)
    technical_correctness: Mapped[int] = mapped_column(Integer, default=0)
    completeness: Mapped[int] = mapped_column(Integer, default=0)
    communication: Mapped[int] = mapped_column(Integer, default=0)
    confidence: Mapped[int] = mapped_column(Integer, default=0)
    examples: Mapped[int] = mapped_column(Integer, default=0)
    feedback: Mapped[str] = mapped_column(Text, default="")
    suggested_better_answer: Mapped[str] = mapped_column(Text, default="")
    question: Mapped[InterviewQuestion] = relationship(back_populates="evaluation")


class Notification(Base):
    """Lightweight in-app notification. No external service is required to use it."""
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    interview_id: Mapped[int | None] = mapped_column(ForeignKey("interviews.id"), nullable=True)
    type: Mapped[str] = mapped_column(String(40))
    title: Mapped[str] = mapped_column(String(160))
    message: Mapped[str] = mapped_column(Text, default="")
    is_read: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user: Mapped[User] = relationship(back_populates="notifications")
