"""Normalized resume context for future LLM prompts.

This module does not parse documents or replace SmartHire's existing resume
parser. It only adapts already-extracted data into a stable prompt-facing shape.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping


@dataclass(slots=True)
class ResumeContext:
    resume_text: str = ""
    skills: list[str] = field(default_factory=list)
    projects: list[str] = field(default_factory=list)
    experience: str | None = None
    technologies: list[str] = field(default_factory=list)
    domain: str | None = None

    @classmethod
    def from_mapping(cls, data: Mapping[str, Any] | None) -> "ResumeContext":
        """Adapt the output of any existing resume parser without coupling to it."""
        data = data or {}

        def list_value(*keys: str) -> list[str]:
            value = next((data.get(key) for key in keys if data.get(key) is not None), [])
            if isinstance(value, str):
                return [value]
            return [str(item) for item in value] if isinstance(value, (list, tuple, set)) else []

        return cls(
            resume_text=str(data.get("resume_text") or data.get("text") or ""),
            skills=list_value("skills", "candidate_skills"),
            projects=list_value("projects", "major_projects"),
            experience=(str(data["experience"]) if data.get("experience") else None),
            technologies=list_value("technologies", "tech_stack"),
            domain=(str(data["domain"]) if data.get("domain") else None),
        )

    def as_prompt_data(self) -> dict[str, str]:
        return {
            "resume": self.resume_text.strip() or "Not provided",
            "skills": ", ".join(self.skills) or "Not provided",
            "projects": "; ".join(self.projects) or "Not provided",
            "experience": self.experience or "Not provided",
            "technologies": ", ".join(self.technologies) or "Not provided",
            "domain": self.domain or "Not provided",
        }
