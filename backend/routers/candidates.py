from fastapi import APIRouter, File, Form, UploadFile, HTTPException, Query
from pydantic import BaseModel
from typing import List
import os
from pathlib import Path

from backend.services.candidate import save_candidate, load_candidates

router = APIRouter()

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
RESUME_DIR = DATA_DIR / "resumes"
RESUME_DIR.mkdir(parents=True, exist_ok=True)


class CandidatePayload(BaseModel):
    email: str
    name: str | None = None
    resume_name: str | None = None
    resume_preview: str | None = None


@router.post("/register")
def register_candidate(payload: CandidatePayload) -> dict:
    return save_candidate(payload.email, payload.resume_name, payload.resume_preview)


@router.post('/upload')
async def upload_candidate_resume(email: str = Form(...), file: UploadFile = File(...)) -> dict:
    # simple size limit
    contents = await file.read()
    max_bytes = 2_000_000  # 2 MB
    if len(contents) > max_bytes:
        raise HTTPException(status_code=400, detail='File too large')

    safe_name = f"{email.replace('@', '_at_')}_{file.filename}"
    target = RESUME_DIR / safe_name
    with open(target, 'wb') as f:
        f.write(contents)

    # attempt to create a text preview for text files
    preview = None
    try:
        text = contents.decode('utf-8', errors='ignore')
        preview = text[:1000]
    except Exception:
        preview = None

    result = save_candidate(email, file.filename, preview, str(target))
    return result


@router.get('/all')
def list_candidates(limit: int = Query(20, ge=1), offset: int = Query(0, ge=0), q: str | None = None) -> List[dict]:
    # load all and filter in service for simplicity
    all_candidates = load_candidates()
    if q:
        q_lower = q.lower()
        all_candidates = [c for c in all_candidates if q_lower in (c.get('name','') + c.get('email','')).lower()]
    return all_candidates[offset: offset + limit]


