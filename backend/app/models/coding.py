from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Float, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class CodingChallenge(Base):
    __tablename__ = "coding_challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(String(50), nullable=False)  # Easy, Medium, Hard
    domain: Mapped[str] = mapped_column(String(100), nullable=False)     # Arrays, Strings, SQL, etc.
    language: Mapped[str] = mapped_column(String(50), nullable=False)    # Python, JavaScript, C++, Java
    starter_code: Mapped[str] = mapped_column(Text, nullable=False)
    test_cases: Mapped[str] = mapped_column(Text, nullable=False)        # JSON string of list of dicts: [{"input": "...", "expected": "..."}]


class CodingSubmission(Base):
    __tablename__ = "coding_submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    challenge_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("coding_challenges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    code: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="SUBMITTED")  # SUCCESS, FAILED, COMPILE_ERROR
    score: Mapped[float] = mapped_column(Float, default=0.0)             # out of 100
    feedback: Mapped[str] = mapped_column(Text, nullable=False, default="")
    complexity: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    code_quality: Mapped[str] = mapped_column(String(50), nullable=False, default="")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User")  # type: ignore[name-defined]
    challenge: Mapped["CodingChallenge"] = relationship("CodingChallenge")
