import json
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.resume import Resume


class ResumeRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def create(
        self,
        user_id: int,
        filename: str,
        file_path: str,
        file_size: int,
        raw_text: str,
        parsed: dict[str, Any],
    ) -> Resume:
        resume = Resume(
            user_id=user_id,
            filename=filename,
            file_path=file_path,
            file_size=file_size,
            raw_text=raw_text,
            candidate_name=parsed.get("candidate_name"),
            candidate_email=parsed.get("candidate_email"),
            candidate_phone=parsed.get("candidate_phone"),
            skills=parsed.get("skills"),
            education=parsed.get("education"),
            experience=parsed.get("experience"),
            summary=parsed.get("summary"),
        )
        self.db.add(resume)
        self.db.commit()
        self.db.refresh(resume)
        return resume

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def get_by_id(self, resume_id: int) -> Resume | None:
        return self.db.get(Resume, resume_id)

    def get_latest_by_user(self, user_id: int) -> Resume | None:
        statement = (
            select(Resume)
            .where(Resume.user_id == user_id)
            .order_by(Resume.uploaded_at.desc())
            .limit(1)
        )
        return self.db.scalar(statement)

    def get_all_by_user(self, user_id: int) -> list[Resume]:
        statement = (
            select(Resume)
            .where(Resume.user_id == user_id)
            .order_by(Resume.uploaded_at.desc())
        )
        return list(self.db.scalars(statement).all())

    # ------------------------------------------------------------------
    # Helper
    # ------------------------------------------------------------------

    @staticmethod
    def skills_count(resume: Resume) -> int:
        """Return the number of parsed skills for a resume row."""
        if not resume.skills:
            return 0
        try:
            return len(json.loads(resume.skills))
        except (json.JSONDecodeError, TypeError):
            return 0
