import json
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Any, Optional


class CandidateProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    programming_languages: list[str] = []
    frameworks: list[str] = []
    libraries: list[str] = []
    databases: list[str] = []
    cloud_technologies: list[str] = []
    tools: list[str] = []
    certifications: list[str] = []
    projects: list[dict[str, Any]] = []
    experience_summary: list[dict[str, Any]] = []
    resume_score: int = 0
    strong_skills: list[str] = []
    weak_skills: list[str] = []
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_orm_with_json(cls, obj: Any) -> "CandidateProfileResponse":
        def _parse(val: str | None, fallback: Any) -> Any:
            if not val:
                return fallback
            try:
                return json.loads(val)
            except Exception:
                return fallback

        return cls(
            id=obj.id,
            user_id=obj.user_id,
            programming_languages=_parse(obj.programming_languages, []),
            frameworks=_parse(obj.frameworks, []),
            libraries=_parse(obj.libraries, []),
            databases=_parse(obj.databases, []),
            cloud_technologies=_parse(obj.cloud_technologies, []),
            tools=_parse(obj.tools, []),
            certifications=_parse(obj.certifications, []),
            projects=_parse(obj.projects, []),
            experience_summary=_parse(obj.experience_summary, []),
            resume_score=obj.resume_score,
            strong_skills=_parse(obj.strong_skills, []),
            weak_skills=_parse(obj.weak_skills, []),
            created_at=obj.created_at,
            updated_at=obj.updated_at,
        )
