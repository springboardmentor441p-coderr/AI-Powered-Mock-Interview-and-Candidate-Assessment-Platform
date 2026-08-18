from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth
from ..database import get_db
from ..services import resume_parser, ats_scorer
from ..notifications_util import notify

router = APIRouter(prefix="/api/resumes", tags=["Resume"])


@router.post("/upload", response_model=schemas.ResumeOut)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported")

    content = await file.read()
    try:
        parsed = resume_parser.parse_resume(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse PDF: {e}")

    ats_result = ats_scorer.compute_ats_score(parsed["raw_text"], parsed["skills"])

    resume = models.Resume(
        owner_id=current_user.id,
        filename=file.filename,
        raw_text=parsed["raw_text"],
        skills=parsed["skills"],
        experience_years=parsed["experience_years"],
        education=parsed["education"],
        summary=parsed["summary"],
        ats_score=ats_result["overall_score"],
        ats_breakdown=ats_result,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    notify(db, current_user.id, f"Resume '{file.filename}' uploaded. ATS score: {ats_result['overall_score']}/100.", "success")
    return resume


@router.post("/{resume_id}/ats-score", response_model=schemas.ResumeOut)
def recompute_ats_score(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id, models.Resume.owner_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    ats_result = ats_scorer.compute_ats_score(resume.raw_text, resume.skills)
    resume.ats_score = ats_result["overall_score"]
    resume.ats_breakdown = ats_result
    db.commit()
    db.refresh(resume)
    return resume


@router.get("/", response_model=List[schemas.ResumeOut])
def list_resumes(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Resume).filter(models.Resume.owner_id == current_user.id).order_by(
        models.Resume.uploaded_at.desc()
    ).all()


@router.get("/{resume_id}", response_model=schemas.ResumeOut)
def get_resume(resume_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id, models.Resume.owner_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume
