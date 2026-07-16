from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import Resume
from backend.services.resume_parser import parse_resume
from backend.utils.auth_utils import decode_token
import os, shutil

router = APIRouter(prefix="/resume", tags=["Resume"])

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    token_data: dict = Depends(decode_token)
):
    user_id = int(token_data["sub"])

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    file_path = os.path.join(UPLOAD_DIR, f"user_{user_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        parsed = parse_resume(file_path)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    resume = Resume(
        user_id        = user_id,
        filename       = file.filename,
        file_path      = file_path,
        extracted_text = parsed["extracted_text"],
        skills         = parsed["skills"],
        education      = parsed["education"],
        experience     = parsed["experience"],
        summary        = parsed["summary"]
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return {
        "message": "Resume uploaded and parsed successfully",
        "resume_id": resume.id,
        "skills": parsed["skills"],
        "education": parsed["education"],
        "experience": parsed["experience"],
        "summary": parsed["summary"]
    }


@router.get("/skills/{user_id}")
def get_skills(
    user_id: int,
    db: Session = Depends(get_db),
    token_data: dict = Depends(decode_token)
):
    resume = db.query(Resume).filter(
        Resume.user_id == user_id
    ).order_by(Resume.uploaded_at.desc()).first()
    
    if not resume:
        raise HTTPException(status_code=404, detail="No resume found for this user")

    return {
        "resume_id": resume.id,
        "filename": resume.filename,
        "skills": resume.skills,
        "education": resume.education,
        "experience": resume.experience,
        "summary": resume.summary
    }