"""
Resume service — orchestrates file saving, text extraction, parsing, and DB persistence.
"""
from __future__ import annotations

import json
import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.resume import Resume
from app.models.candidate_profile import CandidateProfile
from app.repositories.resume_repository import ResumeRepository
from app.schemas.resume import ResumeListItem, ResumeUploadResponse
from app.utils.resume_parser import extract_text, parse_resume

settings = get_settings()

_ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}
_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


class ResumeService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ResumeRepository(db)

    # ------------------------------------------------------------------
    # Upload & Parse
    # ------------------------------------------------------------------

    async def upload_and_parse(self, user_id: int, file: UploadFile) -> ResumeUploadResponse:
        # Validate extension
        filename = file.filename or "resume"
        ext = Path(filename).suffix.lower()
        if ext not in _ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported file type '{ext}'. Please upload a PDF or DOCX.")

        # Read content and check size
        content = await file.read()
        if len(content) > _MAX_FILE_SIZE:
            raise ValueError("File too large. Maximum allowed size is 10 MB.")

        # Save to disk
        upload_dir = Path(settings.upload_dir) / str(user_id)
        upload_dir.mkdir(parents=True, exist_ok=True)
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = upload_dir / unique_name
        file_path.write_bytes(content)

        # Extract text
        try:
            raw_text = extract_text(str(file_path))
        except ValueError as exc:
            file_path.unlink(missing_ok=True)
            raise ValueError(f"Could not read file: {exc}") from exc

        # Parse structured fields
        parsed = parse_resume(raw_text)

        # Persist to DB
        resume = self.repo.create(
            user_id=user_id,
            filename=filename,
            file_path=str(file_path),
            file_size=len(content),
            raw_text=raw_text,
            parsed=parsed,
        )

        # Create or update CandidateProfile
        profile = self.db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
        if not profile:
            profile = CandidateProfile(user_id=user_id)
            self.db.add(profile)
        
        profile.programming_languages = parsed.get("programming_languages")
        profile.frameworks = parsed.get("frameworks")
        profile.libraries = parsed.get("libraries")
        profile.databases = parsed.get("databases")
        profile.cloud_technologies = parsed.get("cloud_technologies")
        profile.tools = parsed.get("tools")
        profile.certifications = parsed.get("certifications")
        profile.projects = parsed.get("projects")
        profile.experience_summary = parsed.get("experience")
        profile.resume_score = parsed.get("resume_score", 0)
        profile.strong_skills = parsed.get("strong_skills")
        profile.weak_skills = parsed.get("weak_skills")
        
        self.db.commit()

        return ResumeUploadResponse.from_orm_with_json(resume)

    # ------------------------------------------------------------------
    # Read helpers
    # ------------------------------------------------------------------

    def get_latest(self, user_id: int) -> ResumeUploadResponse | None:
        resume = self.repo.get_latest_by_user(user_id)
        if not resume:
            return None
        return ResumeUploadResponse.from_orm_with_json(resume)

    def get_all(self, user_id: int) -> list[ResumeListItem]:
        resumes = self.repo.get_all_by_user(user_id)
        items: list[ResumeListItem] = []
        for r in resumes:
            items.append(
                ResumeListItem(
                    id=r.id,
                    filename=r.filename,
                    file_size=r.file_size,
                    candidate_name=r.candidate_name,
                    skills_count=self.repo.skills_count(r),
                    uploaded_at=r.uploaded_at,
                )
            )
        return items
