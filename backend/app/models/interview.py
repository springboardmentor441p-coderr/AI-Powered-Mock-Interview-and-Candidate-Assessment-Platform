from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Float, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    candidate_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    resume_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("resumes.id", ondelete="SET NULL"),
        nullable=True,
    )

    job_role: Mapped[str] = mapped_column(String(100), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(50), nullable=False)  # Beginner, Intermediate, Advanced
    interview_type: Mapped[str] = mapped_column(String(50), nullable=False)  # Technical, HR, Mixed
    status: Mapped[str] = mapped_column(String(50), default="IN_PROGRESS")  # IN_PROGRESS, COMPLETED, PAUSED, TERMINATED
    current_round: Mapped[int] = mapped_column(Integer, default=1)  # 1 or 2
    cumulative_score: Mapped[float] = mapped_column(Float, default=0.0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    candidate: Mapped["User"] = relationship("User")  # type: ignore[name-defined]
    resume: Mapped["Resume"] = relationship("Resume")  # type: ignore[name-defined]
    questions: Mapped[list["InterviewQuestion"]] = relationship("InterviewQuestion", back_populates="session", cascade="all, delete-orphan")
    scores: Mapped[list["InterviewScore"]] = relationship("InterviewScore", back_populates="session", cascade="all, delete-orphan")
    memory: Mapped["InterviewMemory"] = relationship("InterviewMemory", back_populates="session", uselist=False, cascade="all, delete-orphan")
    report: Mapped["Report"] = relationship("Report", back_populates="session", uselist=False, cascade="all, delete-orphan")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("interview_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    question_number: Mapped[int] = mapped_column(Integer, nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    session: Mapped["InterviewSession"] = relationship("InterviewSession", back_populates="questions")
    answer: Mapped["InterviewAnswer"] = relationship("InterviewAnswer", back_populates="question", uselist=False, cascade="all, delete-orphan")


class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    question_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("interview_questions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    answer_text: Mapped[str] = mapped_column(Text, nullable=False)

    answered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    question: Mapped["InterviewQuestion"] = relationship("InterviewQuestion", back_populates="answer")
    evaluation: Mapped["Evaluation"] = relationship("Evaluation", back_populates="answer", uselist=False, cascade="all, delete-orphan")


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    answer_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("interview_answers.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # 7 key metrics evaluated out of 10
    score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)  # overall out of 10
    technical_accuracy: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    concept_understanding: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    communication: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    problem_solving: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    completeness: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    practical_knowledge: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    strengths: Mapped[str] = mapped_column(Text, nullable=False, default="")
    weaknesses: Mapped[str] = mapped_column(Text, nullable=False, default="")
    reasoning: Mapped[str] = mapped_column(Text, nullable=False, default="")  # internal reasoning

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    answer: Mapped["InterviewAnswer"] = relationship("InterviewAnswer", back_populates="evaluation")


class InterviewScore(Base):
    __tablename__ = "interview_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("interview_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    passing_status: Mapped[str] = mapped_column(String(50), nullable=False)  # PASS, FAIL, SKIPPED

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    session: Mapped["InterviewSession"] = relationship("InterviewSession", back_populates="scores")


class InterviewMemory(Base):
    __tablename__ = "interview_memories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("interview_sessions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    topics_covered: Mapped[str | None] = mapped_column(Text, nullable=True)     # JSON string of list of topics
    topics_remaining: Mapped[str | None] = mapped_column(Text, nullable=True)   # JSON string of list of topics
    candidate_confidence: Mapped[str | None] = mapped_column(String(50), nullable=True)  # LOW, MEDIUM, HIGH
    raw_memory: Mapped[str | None] = mapped_column(Text, nullable=True)         # JSON string dictionary of state

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    session: Mapped["InterviewSession"] = relationship("InterviewSession", back_populates="memory")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("interview_sessions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    overall_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    round1_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    round2_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    strengths: Mapped[str] = mapped_column(Text, nullable=False, default="")      # JSON list
    weaknesses: Mapped[str] = mapped_column(Text, nullable=False, default="")    # JSON list
    learning_path: Mapped[str] = mapped_column(Text, nullable=False, default="") # JSON list of modules

    hiring_recommendation: Mapped[str] = mapped_column(String(100), nullable=False) # Ready for Interview, Needs Improvement, Not Recommended
    summary_notes: Mapped[str] = mapped_column(Text, nullable=False, default="")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    session: Mapped["InterviewSession"] = relationship("InterviewSession", back_populates="report")
