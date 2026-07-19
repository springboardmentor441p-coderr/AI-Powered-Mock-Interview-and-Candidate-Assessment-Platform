from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.database import get_db
from backend.models.user import Resume
from backend.services.question_generator import generate_questions
from backend.utils.auth_utils import decode_token

router = APIRouter(prefix="/questions", tags=["Questions"])


class QuestionRequest(BaseModel):
    resume_id: int
    jd_text: str


@router.post("/generate")
def generate_interview_questions(
    data: QuestionRequest,
    db: Session = Depends(get_db),
    token_data: dict = Depends(decode_token)
):
    # Get resume from database
    resume = db.query(Resume).filter(Resume.id == data.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if not resume.extracted_text:
        raise HTTPException(status_code=400, detail="Resume text not extracted yet")

    # Generate questions using AI
    questions = generate_questions(
        resume_text=resume.extracted_text,
        jd_text=data.jd_text
    )

    return {
        "resume_id": data.resume_id,
        "total_questions": len(questions),
        "questions": questions
    }