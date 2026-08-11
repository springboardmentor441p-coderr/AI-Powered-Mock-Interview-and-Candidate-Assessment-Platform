from __future__ import annotations

import re
from backend.database import db
from backend.models.candidate import Candidate


def extract_candidate_name(email: str) -> str:
    local_part = email.split("@", 1)[0].replace(".", " ").replace("_", " ")
    parts = [part for part in re.split(r"[^a-zA-Z]+", local_part) if part]
    if not parts:
        return email.split("@", 1)[0]
    return " ".join(part.capitalize() for part in parts)


def init_db() -> None:
    pass

def load_candidates() -> list[dict]:
    docs = db.candidates.find()
    return [Candidate.from_mongo(doc).to_dict() for doc in docs]


def save_candidate(
    email: str,
    resume_name: str | None = None,
    resume_preview: str | None = None,
    resume_path: str | None = None,
    college_name: str | None = None,
    degree: str | None = None,
    graduation_year: str | None = None,
    cgpa: str | None = None,
) -> dict:
    doc = db.candidates.find_one({"email": email})
    if doc is None:
        candidate = Candidate(email=email, name=extract_candidate_name(email))
        doc_to_insert = candidate.model_dump(by_alias=True)
        if "_id" in doc_to_insert and not doc_to_insert["_id"]:
            del doc_to_insert["_id"]
        result = db.candidates.insert_one(doc_to_insert)
        candidate.id = str(result.inserted_id)
    else:
        candidate = Candidate.from_mongo(doc)

    candidate.name = extract_candidate_name(email)
    if resume_name is not None: candidate.resume_name = resume_name
    if resume_preview is not None: candidate.resume_preview = resume_preview
    if resume_path is not None: candidate.resume_path = resume_path
    candidate.resume_uploaded = bool(candidate.resume_name)
    if college_name is not None: candidate.college_name = college_name
    if degree is not None: candidate.degree = degree
    if graduation_year is not None: candidate.graduation_year = graduation_year
    if cgpa is not None: candidate.cgpa = cgpa

    update_data = candidate.model_dump(by_alias=True)
    if "_id" in update_data:
        del update_data["_id"]

    db.candidates.update_one({"email": email}, {"$set": update_data})
    
    return candidate.to_dict()

