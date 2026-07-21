from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="candidate", nullable=False)  # candidate, recruiter, admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sessions = relationship("InterviewSession", back_populates="candidate", cascade="all, delete-orphan")
    templates = relationship("InterviewTemplate", back_populates="creator", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    resume_path = Column(String, nullable=True)
    parsed_skills = Column(JSON, nullable=True)  # List of strings: ["Python", "React", ...]
    parsed_experience = Column(JSON, nullable=True)  # List of dicts
    education = Column(JSON, nullable=True)  # List of dicts
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="profile")


class InterviewTemplate(Base):
    __tablename__ = "interview_templates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    domain = Column(String, nullable=False)  # Software Engineering, Data Science, HR, Behavioral, etc.
    difficulty = Column(String, nullable=False)  # Easy, Medium, Hard
    questions = Column(JSON, nullable=False)  # List of strings (pre-defined questions)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="templates")
    sessions = relationship("InterviewSession", back_populates="template")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    template_id = Column(Integer, ForeignKey("interview_templates.id", ondelete="SET NULL"), nullable=True)
    domain = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    status = Column(String, default="created", nullable=False)  # created, in_progress, completed
    
    # Aggregated Scores
    total_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    technical_score = Column(Float, nullable=True)
    professionalism_score = Column(Float, nullable=True)
    
    feedback = Column(JSON, nullable=True)  # {strengths: [...], weaknesses: [...], recommendations: [...], resources: [...]}
    resume_text = Column(Text, nullable=True)
    job_description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    candidate = relationship("User", back_populates="sessions")
    template = relationship("InterviewTemplate", back_populates="sessions")
    questions = relationship("InterviewQuestion", back_populates="session", cascade="all, delete-orphan")
    answers = relationship("InterviewAnswer", back_populates="session", cascade="all, delete-orphan")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    category = Column(String, nullable=False)  # technical, hr, behavioral, aptitude
    order = Column(Integer, nullable=False)

    # Relationships
    session = relationship("InterviewSession", back_populates="questions")
    answers = relationship("InterviewAnswer", back_populates="question", cascade="all, delete-orphan")


class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("interview_questions.id", ondelete="CASCADE"), nullable=False)
    
    answer_text = Column(Text, nullable=False)
    duration_seconds = Column(Float, default=0.0)
    
    # Metrics
    filler_word_count = Column(Integer, default=0)
    wpm = Column(Integer, default=0)
    confidence_pct = Column(Float, default=0.0)      # Speech metrics confidence
    eye_contact_pct = Column(Float, default=0.0)      # Video/Webcam attention confidence
    transcript_confidence = Column(Float, default=1.0)
    
    # Evaluation
    score = Column(Float, nullable=True)
    feedback_text = Column(Text, nullable=True)
    audio_path = Column(String, nullable=True)

    # Relationships
    session = relationship("InterviewSession", back_populates="answers")
    question = relationship("InterviewQuestion", back_populates="answers")
