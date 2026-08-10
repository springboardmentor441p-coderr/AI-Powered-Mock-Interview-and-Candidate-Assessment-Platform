from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), default="Candidate")
    resume_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    resume_preview: Mapped[str | None] = mapped_column(Text, nullable=True)
    resume_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    resume_uploaded: Mapped[bool] = mapped_column(Boolean, default=False)
    college_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    degree: Mapped[str | None] = mapped_column(String(255), nullable=True)
    graduation_year: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cgpa: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "resume_name": self.resume_name,
            "resume_preview": self.resume_preview,
            "resume_uploaded": self.resume_uploaded,
            "college_name": self.college_name,
            "degree": self.degree,
            "graduation_year": self.graduation_year,
            "cgpa": self.cgpa,
            "created_at": self.created_at.isoformat(),
        }
