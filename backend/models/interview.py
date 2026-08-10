"""
Interview session, questions, responses, and scores.
One InterviewSession → many Questions → each Question has one Response → one Score.
"""
from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[int]           = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int]      = mapped_column(ForeignKey("users.id"), index=True)
    interview_type: Mapped[str]  = mapped_column(String(50))   # Technical | HR | Behavioral | Aptitude
    domain: Mapped[str]          = mapped_column(String(100))  # Web Dev | AI/ML | Finance ...
    difficulty: Mapped[str]      = mapped_column(String(20))   # Easy | Medium | Hard
    status: Mapped[str]          = mapped_column(String(20), default="active")  # active | completed
    total_questions: Mapped[int] = mapped_column(Integer, default=10)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    questions: Mapped[list["Question"]] = relationship("Question", back_populates="session", cascade="all, delete")
    score: Mapped["SessionScore | None"]  = relationship("SessionScore", back_populates="session", uselist=False, cascade="all, delete")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int]              = mapped_column(primary_key=True, index=True)
    session_id: Mapped[int]      = mapped_column(ForeignKey("interview_sessions.id"), index=True)
    question_number: Mapped[int] = mapped_column(Integer)
    question_text: Mapped[str]   = mapped_column(Text)
    expected_keywords: Mapped[str | None] = mapped_column(Text, nullable=True)  # comma-separated
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session:  Mapped["InterviewSession"] = relationship("InterviewSession", back_populates="questions")
    response: Mapped["Response | None"]  = relationship("Response", back_populates="question", uselist=False, cascade="all, delete")


class Response(Base):
    __tablename__ = "responses"

    id: Mapped[int]          = mapped_column(primary_key=True, index=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"), index=True)
    session_id: Mapped[int]  = mapped_column(ForeignKey("interview_sessions.id"), index=True)

    # What the candidate said (from Whisper STT)
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Speech analysis features (stored as JSON for flexibility)
    speech_features: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Example: {"word_count": 85, "filler_count": 3, "pace_wpm": 142,
    #            "filler_words": ["um","uh"], "grammar_errors": 1}

    # Vision features from webcam
    vision_features: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Example: {"eye_contact_pct": 84, "emotion": "confident", "attention_score": 0.9}

    # AI evaluation of answer quality
    answer_score: Mapped[float | None]    = mapped_column(Float, nullable=True)  # 0-100
    ai_feedback: Mapped[str | None]       = mapped_column(Text, nullable=True)

    answered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    question: Mapped["Question"] = relationship("Question", back_populates="response")


class SessionScore(Base):
    """
    Final weighted score for a completed interview session.
    Formula: Communication×0.30 + Confidence×0.25 + Technical×0.30 + Professionalism×0.15
    """
    __tablename__ = "session_scores"

    id: Mapped[int]         = mapped_column(primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("interview_sessions.id"), unique=True, index=True)
    user_id: Mapped[int]    = mapped_column(ForeignKey("users.id"), index=True)

    # Sub-scores (0-100)
    communication_score: Mapped[float]    = mapped_column(Float, default=0)   # 30% weight
    confidence_score: Mapped[float]       = mapped_column(Float, default=0)   # 25% weight
    technical_score: Mapped[float]        = mapped_column(Float, default=0)   # 30% weight
    professionalism_score: Mapped[float]  = mapped_column(Float, default=0)   # 15% weight

    # Weighted final score
    overall_score: Mapped[float] = mapped_column(Float, default=0)

    # Rating label
    rating: Mapped[str] = mapped_column(String(30), default="")  # Excellent|Good|Average|Needs Improvement|Poor

    # AI-generated textual feedback
    strengths: Mapped[str | None]     = mapped_column(Text, nullable=True)
    weaknesses: Mapped[str | None]    = mapped_column(Text, nullable=True)
    suggestions: Mapped[str | None]   = mapped_column(Text, nullable=True)

    scored_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped["InterviewSession"] = relationship("InterviewSession", back_populates="score")
