import os
import io
import json
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from pypdf import PdfReader
from app.database import get_db
from app.models.models import Resume, JobDescription
from app.schemas.schemas import JDUploadRequest, GenerateInterviewRequest
from app.services.ai_service import AIService

router = APIRouter(prefix="/analyze", tags=["Resume & Job Description Analysis"])

def extract_text_from_bytes(file_bytes: bytes, filename: str) -> str:
    ext = os.path.splitext(filename.lower())[1]
    if ext == ".pdf":
        try:
            pdf_file = io.BytesIO(file_bytes)
            reader = PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            return text.strip()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read PDF file: {str(e)}")
    else:
        # Default to raw text decode
        try:
            return file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                return file_bytes.decode("latin-1")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to decode text file: {str(e)}")

@router.post("/resume")
def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Step 5: AI Resume Analysis - Pure information extraction from uploaded file (supporting TXT/PDF).
    No ATS score, no resume matching.
    """
    file_bytes = file.file.read()
    raw_text = extract_text_from_bytes(file_bytes, file.filename)
    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="The uploaded file contains no readable text.")

    extracted = AIService.extract_resume_info(raw_text)
    resume = Resume(
        user_id=1,
        filename=file.filename,
        raw_text=raw_text,
        extracted_skills=extracted.get("skills", [])
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return {
        "resume_id": resume.id,
        "filename": resume.filename,
        "extracted_info": extracted,
        "message": "Resume information extracted successfully (No ATS score applied)"
    }

@router.post("/jd")
def upload_jd(data: JDUploadRequest, db: Session = Depends(get_db)):
    """
    Step 6: AI Understands JD - Extracts required skills, responsibilities, topics.
    """
    extracted = AIService.extract_jd_info(data.raw_text)
    jd = JobDescription(
        user_id=1,
        title=data.title,
        company=data.company or "Target Company",
        raw_text=data.raw_text,
        extracted_skills=extracted.get("required_skills", [])
    )
    db.add(jd)
    db.commit()
    db.refresh(jd)
    return {
        "jd_id": jd.id,
        "title": jd.title,
        "extracted_info": extracted,
        "message": "Job Description requirements analyzed successfully"
    }

@router.post("/generate-interview")
def generate_interview(data: GenerateInterviewRequest):
    """
    Step 7: AI Generates Interview by combining Resume + JD.
    """
    # If the text is already parsed JSON structure from the frontend, load it directly
    try:
        cleaned_text = data.resume_text.strip()
        if cleaned_text.startswith("{") and cleaned_text.endswith("}"):
            resume_info = json.loads(cleaned_text)
        else:
            resume_info = AIService.extract_resume_info(data.resume_text)
    except Exception:
        resume_info = AIService.extract_resume_info(data.resume_text)

    target_role = data.target_role or "Software Engineer"

    if not data.jd_text or not data.jd_text.strip():
        jd_info = {
            "title": target_role,
            "required_skills": [target_role],
            "responsibilities": [f"Develop and maintain high quality applications for the {target_role} position."],
            "experience_level": data.experience_level or "Mid-Level",
            "technical_topics": [target_role],
            "behavioral_topics": ["Problem Solving", "Teamwork"]
        }
    else:
        jd_info = AIService.extract_jd_info(data.jd_text)
        if not jd_info.get("title"):
            jd_info["title"] = target_role

    questions = AIService.generate_candidate_interview(
        resume_info,
        jd_info,
        interview_type=data.interview_type,
        experience_level=data.experience_level,
        num_questions=data.num_questions,
        target_role=target_role
    )
    return {
        "resume_info": resume_info,
        "jd_info": jd_info,
        "questions": questions
    }
