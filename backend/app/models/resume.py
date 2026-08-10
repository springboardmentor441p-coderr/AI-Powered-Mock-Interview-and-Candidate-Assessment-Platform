from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # File metadata
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)  # bytes

    # Raw extracted text
    raw_text: Mapped[str] = mapped_column(Text, nullable=False, default="")

    # Parsed structured fields (all nullable — parser may not find everything)
    candidate_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    candidate_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    candidate_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # JSON-serialised lists stored as text
    skills: Mapped[str | None] = mapped_column(Text, nullable=True)       # '["Python","FastAPI",...]'
    education: Mapped[str | None] = mapped_column(Text, nullable=True)    # '[{"degree":"...","institution":"..."}]'
    experience: Mapped[str | None] = mapped_column(Text, nullable=True)   # '[{"title":"...","company":"..."}]'
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship back to user (optional — for eager loading)
    user: Mapped["User"] = relationship("User", back_populates="resumes")  # type: ignore[name-defined]
