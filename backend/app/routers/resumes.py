from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, status
from sqlalchemy.orm import Session
from pypdf import PdfReader
import io
from ..database import get_db
from .. import models, schemas, auth
from ..services.ai_service import AIService

router = APIRouter(prefix="/api/resumes", tags=["resumes"])

@router.post("/upload", response_model=schemas.ProfileResponse)
async def upload_resume(
    request: Request,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.check_role(["candidate"])),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported."
        )

    try:
        # Read PDF binary stream
        contents = await file.read()
        pdf_file = io.BytesIO(contents)
        reader = PdfReader(pdf_file)
        
        # Extract text from all pages
        resume_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                resume_text += text + "\n"
                
        if not resume_text.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Could not extract text from the PDF file. Ensure it is not an image-only scan."
            )
            
        # Get optional API keys from headers
        api_keys = {
            "gemini_api_key": request.headers.get("x-gemini-key"),
            "openai_api_key": request.headers.get("x-openai-key")
        }
        
        # Parse resume text using AI service
        parsed_data = AIService.parse_resume(resume_text, api_keys)
        
        # Find and update the user profile
        profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
        if not profile:
            profile = models.Profile(user_id=current_user.id)
            db.add(profile)
            
        profile.parsed_skills = parsed_data.get("parsed_skills", [])
        profile.parsed_experience = parsed_data.get("parsed_experience", [])
        profile.education = parsed_data.get("education", [])
        profile.summary = parsed_data.get("summary", "")
        
        db.commit()
        db.refresh(profile)
        return profile
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing the resume: {str(e)}"
        )
