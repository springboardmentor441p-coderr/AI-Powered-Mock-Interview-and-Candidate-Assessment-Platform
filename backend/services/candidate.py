from __future__ import annotations

import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.database import engine
from backend.models.candidate import Candidate
from backend.models.user import User


def extract_candidate_name(email: str) -> str:
    local_part = email.split("@", 1)[0].replace(".", " ").replace("_", " ")
    parts = [part for part in re.split(r"[^a-zA-Z]+", local_part) if part]
    if not parts:
        return email.split("@", 1)[0]
    return " ".join(part.capitalize() for part in parts)


def init_db() -> None:
    from backend.database import Base

    Base.metadata.create_all(bind=engine)


init_db()


def load_candidates() -> list[dict]:
    with Session(engine) as session:
        candidates = session.scalars(select(Candidate)).all()
        return [candidate.to_dict() for candidate in candidates]


def save_candidate(
    email: str,
    resume_name: str | None = None,
    resume_preview: str | None = None,
    resume_path: str | None = None,
) -> dict:
    with Session(engine) as session:
        candidate = session.scalar(select(Candidate).where(Candidate.email == email))
        if candidate is None:
            candidate = Candidate(email=email, name=extract_candidate_name(email))
            session.add(candidate)
        candidate.name = extract_candidate_name(email)
        candidate.resume_name = resume_name
        candidate.resume_preview = resume_preview
        candidate.resume_path = resume_path
        candidate.resume_uploaded = bool(resume_name)
        session.commit()
        session.refresh(candidate)
        return candidate.to_dict()
