import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Boolean
)
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="candidate")  # candidate | recruiter | admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_active = Column(Boolean, default=True)

    resumes = relationship("Resume", back_populates="owner", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="candidate", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    raw_text = Column(Text)
    skills = Column(JSON, default=list)
    experience_years = Column(Float, default=0)
    education = Column(JSON, default=list)
    summary = Column(Text, default="")
    ats_score = Column(Float, nullable=True)
    ats_breakdown = Column(JSON, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="resumes")


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"))
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    interview_type = Column(String)  # technical | hr | behavioral | aptitude
    difficulty = Column(String, default="medium")  # easy | medium | hard
    domain = Column(String, default="general")
    job_title = Column(String, nullable=True)
    mode = Column(String, default="practice")  # practice | timed
    time_limit_seconds = Column(Integer, nullable=True)
    status = Column(String, default="in_progress")  # in_progress | completed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)

    communication_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    technical_score = Column(Float, nullable=True)
    professionalism_score = Column(Float, nullable=True)
    overall_score = Column(Float, nullable=True)
    rating = Column(String, nullable=True)

    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    recommendations = Column(JSON, default=list)

    candidate = relationship("User", back_populates="interviews")
    questions = relationship("InterviewQuestion", back_populates="interview", cascade="all, delete-orphan")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"))
    order_index = Column(Integer)
    question_text = Column(Text)
    category = Column(String)
    answer_text = Column(Text, default="")
    time_taken_seconds = Column(Integer, default=0)
    filler_word_count = Column(Integer, default=0)
    eye_contact_pct = Column(Float, default=0.0)   # simulated / client-reported
    confidence_signal = Column(Float, default=0.0)  # simulated / client-reported
    keyword_match_pct = Column(Float, default=0.0)

    interview = relationship("Interview", back_populates="questions")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String)
    notif_type = Column(String, default="info")  # info | success | reminder
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
