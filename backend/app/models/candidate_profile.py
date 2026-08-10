from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    programming_languages: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string
    frameworks: Mapped[str | None] = mapped_column(Text, nullable=True)             # JSON string
    libraries: Mapped[str | None] = mapped_column(Text, nullable=True)              # JSON string
    databases: Mapped[str | None] = mapped_column(Text, nullable=True)              # JSON string
    cloud_technologies: Mapped[str | None] = mapped_column(Text, nullable=True)     # JSON string
    tools: Mapped[str | None] = mapped_column(Text, nullable=True)                  # JSON string
    certifications: Mapped[str | None] = mapped_column(Text, nullable=True)          # JSON string
    projects: Mapped[str | None] = mapped_column(Text, nullable=True)                # JSON string
    experience_summary: Mapped[str | None] = mapped_column(Text, nullable=True)      # JSON string
    
    resume_score: Mapped[int] = mapped_column(Integer, default=0)
    strong_skills: Mapped[str | None] = mapped_column(Text, nullable=True)           # JSON string
    weak_skills: Mapped[str | None] = mapped_column(Text, nullable=True)             # JSON string

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User")  # type: ignore[name-defined]
