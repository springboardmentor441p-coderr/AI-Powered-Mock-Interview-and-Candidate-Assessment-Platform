"""
models/session.py — InterviewSession, InterviewQuestion, InterviewAnswer, SessionReport

One interview session contains many questions.
Each question gets one answer from the candidate.
After all answers, a SessionReport is generated with scores.
"""
from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.database import Base


class InterviewSession(Base):
    """One mock interview run by a candidate."""
    __tablename__ = "interview_sessions"

    id:             Mapped[int]  = mapped_column(primary_key=True, index=True)
    user_id:        Mapped[int]  = mapped_column(Integer, ForeignKey("users.id"), index=True)
    interview_type: Mapped[str]  = mapped_column(String(50))   # Technical | HR | Behavioral | Aptitude
    domain:         Mapped[str]  = mapped_column(String(100))  # Web Dev | AI/ML | Finance | Core CS
    difficulty:     Mapped[str]  = mapped_column(String(20))   # Easy | Medium | Hard
    status:         Mapped[str]  = mapped_column(String(20), default="active")  # active | completed | abandoned
    started_at:     Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at:       Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    rules_accepted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Scheduling fields
    company_name:     Mapped[str | None] = mapped_column(String(100), nullable=True)
    job_title:        Mapped[str | None] = mapped_column(String(100), nullable=True)
    scheduled_start:  Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30)

    # relationships
    questions = relationship("InterviewQuestion", back_populates="session", cascade="all, delete")
    report    = relationship("SessionReport", back_populates="session", uselist=False, cascade="all, delete")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "interview_type": self.interview_type,
            "domain": self.domain,
            "difficulty": self.difficulty,
            "status": self.status,
            "started_at": self.started_at.isoformat(),
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "rules_accepted_at": self.rules_accepted_at.isoformat() if getattr(self, 'rules_accepted_at', None) else None,
            "company_name": getattr(self, 'company_name', None),
            "job_title": getattr(self, 'job_title', None),
            "scheduled_start": self.scheduled_start.isoformat() if getattr(self, 'scheduled_start', None) else None,
            "duration_minutes": getattr(self, 'duration_minutes', 30),
            "question_count": len(self.questions) if self.questions else 0,
        }


class InterviewQuestion(Base):
    """One AI-generated question inside a session."""
    __tablename__ = "interview_questions"

    id:               Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id:       Mapped[int] = mapped_column(Integer, ForeignKey("interview_sessions.id"), index=True)
    question_number:  Mapped[int] = mapped_column(Integer)          # 1..10
    question_text:    Mapped[str] = mapped_column(Text)
    expected_keywords: Mapped[str | None] = mapped_column(Text, nullable=True)  # CSV of expected key terms
    question_type:    Mapped[str] = mapped_column(String(50))       # same as session type
    created_at:       Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="questions")
    answer  = relationship("InterviewAnswer", back_populates="question", uselist=False, cascade="all, delete")

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "question_number": self.question_number,
            "question_text": self.question_text,
            "expected_keywords": self.expected_keywords,
        }


class InterviewAnswer(Base):
    """Candidate's spoken/typed answer to one question — with per-answer scores."""
    __tablename__ = "interview_answers"

    id:               Mapped[int]   = mapped_column(primary_key=True, index=True)
    question_id:      Mapped[int]   = mapped_column(Integer, ForeignKey("interview_questions.id"), index=True)
    session_id:       Mapped[int]   = mapped_column(Integer, ForeignKey("interview_sessions.id"), index=True)
    transcribed_text: Mapped[str]   = mapped_column(Text)           # Whisper output
    answer_duration:  Mapped[float] = mapped_column(Float, default=0)  # seconds

    # Per-answer AI scores (0-100)
    communication_score:   Mapped[float] = mapped_column(Float, default=0)
    technical_score:       Mapped[float] = mapped_column(Float, default=0)
    confidence_score:      Mapped[float] = mapped_column(Float, default=0)
    professionalism_score: Mapped[float] = mapped_column(Float, default=0)

    # Speech analysis details
    filler_word_count: Mapped[int]        = mapped_column(Integer, default=0)
    words_per_minute:  Mapped[float]      = mapped_column(Float, default=0)
    ai_feedback:       Mapped[str | None] = mapped_column(Text, nullable=True)  # GPT feedback text

    # Eye contact / emotion from webcam (sent from frontend)
    eye_contact_score: Mapped[float] = mapped_column(Float, default=0)   # 0-100
    emotion_label:     Mapped[str]   = mapped_column(String(50), default="neutral")

    answered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    question = relationship("InterviewQuestion", back_populates="answer")

    def to_dict(self):
        return {
            "id": self.id,
            "question_id": self.question_id,
            "transcribed_text": self.transcribed_text,
            "communication_score": self.communication_score,
            "technical_score": self.technical_score,
            "confidence_score": self.confidence_score,
            "professionalism_score": self.professionalism_score,
            "filler_word_count": self.filler_word_count,
            "words_per_minute": self.words_per_minute,
            "ai_feedback": self.ai_feedback,
            "eye_contact_score": self.eye_contact_score,
            "emotion_label": self.emotion_label,
        }


class IntegrityEvent(Base):
    """Timestamped flags for gaze tracking, multiple faces, etc."""
    __tablename__ = "integrity_events"

    id:               Mapped[int]   = mapped_column(primary_key=True, index=True)
    session_id:       Mapped[int]   = mapped_column(Integer, ForeignKey("interview_sessions.id"), index=True)
    event_type:       Mapped[str]   = mapped_column(String(50))   # NO_FACE_DETECTED, MULTIPLE_FACES, GAZE_AWAY
    duration_seconds: Mapped[float] = mapped_column(Float, default=0)
    description:      Mapped[str | None] = mapped_column(Text, nullable=True)
    severity:         Mapped[str]   = mapped_column(String(20), default="medium") # low, medium, high
    timestamp:        Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", backref="integrity_events")

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "event_type": self.event_type,
            "duration_seconds": self.duration_seconds,
            "description": self.description,
            "severity": self.severity,
            "timestamp": self.timestamp.isoformat(),
        }


class SessionReport(Base):
    """Final aggregated report after all questions answered."""
    __tablename__ = "session_reports"

    id:         Mapped[int] = mapped_column(primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("interview_sessions.id"), unique=True)
    user_id:    Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)

    # Weighted overall score (0-100)
    overall_score:         Mapped[float] = mapped_column(Float)
    communication_score:   Mapped[float] = mapped_column(Float)
    confidence_score:      Mapped[float] = mapped_column(Float)
    technical_score:       Mapped[float] = mapped_column(Float)
    professionalism_score: Mapped[float] = mapped_column(Float)

    # Performance rating
    rating: Mapped[str] = mapped_column(String(30))  # Excellent|Good|Average|Needs Improvement|Poor

    # AI generated text feedback
    strengths:    Mapped[str | None] = mapped_column(Text, nullable=True)
    weaknesses:   Mapped[str | None] = mapped_column(Text, nullable=True)
    suggestions:  Mapped[str | None] = mapped_column(Text, nullable=True)

    # Stats
    total_questions:    Mapped[int]   = mapped_column(Integer, default=0)
    avg_filler_words:   Mapped[float] = mapped_column(Float, default=0)
    avg_words_per_min:  Mapped[float] = mapped_column(Float, default=0)
    avg_eye_contact:    Mapped[float] = mapped_column(Float, default=0)
    duration_minutes:   Mapped[float] = mapped_column(Float, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="report")

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "overall_score": round(self.overall_score, 1),
            "communication_score": round(self.communication_score, 1),
            "confidence_score": round(self.confidence_score, 1),
            "technical_score": round(self.technical_score, 1),
            "professionalism_score": round(self.professionalism_score, 1),
            "rating": self.rating,
            "strengths": self.strengths,
            "weaknesses": self.weaknesses,
            "suggestions": self.suggestions,
            "total_questions": self.total_questions,
            "avg_filler_words": self.avg_filler_words,
            "avg_words_per_min": self.avg_words_per_min,
            "avg_eye_contact": self.avg_eye_contact,
            "duration_minutes": self.duration_minutes,
            "created_at": self.created_at.isoformat(),
        }
