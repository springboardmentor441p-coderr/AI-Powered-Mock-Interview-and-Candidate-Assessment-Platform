from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.database import get_db
from backend.models.user import Resume, JDMatch
from backend.services.jd_matcher import calculate_match
from backend.utils.auth_utils import decode_token

router = APIRouter(prefix="/match", tags=["JD Matching"])


class JDMatchRequest(BaseModel):
    resume_id: int
    jd_text: str


@router.post("/jd")
def match_resume_with_jd(
    data: JDMatchRequest,
    db: Session = Depends(get_db),
    token_data: dict = Depends(decode_token)
):
    # Resume database se nikalo
    resume = db.query(Resume).filter(Resume.id == data.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Match calculate karo
    result = calculate_match(resume.extracted_text, data.jd_text)

    # Result database mein save karo
    jd_match = JDMatch(
        resume_id      = data.resume_id,
        jd_text        = data.jd_text,
        match_score    = result["match_score"],
        matched_skills = result["matched_skills"],
        missing_skills = result["missing_skills"],
        is_eligible    = result["is_eligible"]
    )
    db.add(jd_match)
    db.commit()

    return {
        "match_percentage": result["match_percentage"],
        "matched_skills": result["matched_skills"],
        "missing_skills": result["missing_skills"],
        "is_eligible": result["is_eligible"],
        "message": result["message"]
    }