import json
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class ResumeUploadResponse(BaseModel):
    """Returned immediately after a successful upload + parse."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    file_size: int
    uploaded_at: datetime

    # Parsed fields
    candidate_name: str | None = None
    candidate_email: str | None = None
    candidate_phone: str | None = None
    summary: str | None = None

    # Stored as JSON strings in the DB — expose as lists/dicts
    skills: list[str] = []
    education: list[dict[str, Any]] = []
    experience: list[dict[str, Any]] = []

    @classmethod
    def from_orm_with_json(cls, obj: Any) -> "ResumeUploadResponse":
        """Helper to deserialise JSON text columns back to Python objects."""
        def _parse(val: str | None, fallback: Any) -> Any:
            if not val:
                return fallback
            try:
                return json.loads(val)
            except (json.JSONDecodeError, TypeError):
                return fallback

        return cls(
            id=obj.id,
            filename=obj.filename,
            file_size=obj.file_size,
            uploaded_at=obj.uploaded_at,
            candidate_name=obj.candidate_name,
            candidate_email=obj.candidate_email,
            candidate_phone=obj.candidate_phone,
            summary=obj.summary,
            skills=_parse(obj.skills, []),
            education=_parse(obj.education, []),
            experience=_parse(obj.experience, []),
        )


class ResumeListItem(BaseModel):
    """Lightweight item used in list responses."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    file_size: int
    candidate_name: str | None = None
    skills_count: int = 0
    uploaded_at: datetime
