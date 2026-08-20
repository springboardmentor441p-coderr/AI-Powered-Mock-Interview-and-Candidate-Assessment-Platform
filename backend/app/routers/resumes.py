import os
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import current_user, require_roles
from ..models import Resume, Role, User
from ..schemas import JobMatchOut, JobMatchRequest, ResumeOut
from ..services.resume_service import save_pdf
from ..services.resume_analysis import detect_skills, extract_pdf_text, extract_resume_context
router = APIRouter(prefix="/resumes", tags=["resumes"])
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads")); UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("", response_model=ResumeOut, status_code=201)
async def upload_resume(file: UploadFile = File(...), user: User = Depends(require_roles(Role.candidate)), db: Session = Depends(get_db)):
    stored_name = await save_pdf(file, UPLOAD_DIR)
    resume = Resume(owner_id=user.id, original_name=Path(file.filename or "resume.pdf").name, stored_name=stored_name, content_type=file.content_type)
    db.add(resume); db.commit(); db.refresh(resume); return resume

@router.get("", response_model=list[ResumeOut])
def list_resumes(user: User = Depends(current_user), db: Session = Depends(get_db)):
    query = select(Resume).order_by(Resume.uploaded_at.desc())
    if user.role == Role.candidate: query = query.where(Resume.owner_id == user.id)
    return db.scalars(query).all()

@router.post("/{resume_id}/job-match", response_model=JobMatchOut)
def job_match(resume_id: int, payload: JobMatchRequest, user: User = Depends(current_user), db: Session = Depends(get_db)):
    resume = db.get(Resume, resume_id)
    if not resume or resume.owner_id != user.id:
        raise HTTPException(404, "Resume not found")
    context = extract_resume_context(extract_pdf_text(UPLOAD_DIR / resume.stored_name))
    resume_skills = context["skills"]
    role_skills = detect_skills(payload.job_description)
    matched = [skill for skill in role_skills if skill in resume_skills]
    missing = [skill for skill in role_skills if skill not in resume_skills]
    score = round(100 * len(matched) / len(role_skills)) if role_skills else 0
    return JobMatchOut(resume_name=resume.original_name, detected_skills=resume_skills, matched_skills=matched, missing_skills=missing, match_score=score, candidate_name=context["candidate_name"], suggested_role=context["suggested_role"], projects=context["projects"], experience=context["experience"], technologies=context["technologies"])
