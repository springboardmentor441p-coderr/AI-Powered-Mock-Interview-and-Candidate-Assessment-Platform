import shutil
import os
from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Database imports
from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models

models.Base.metadata.create_all(bind=engine)

# Creates an 'uploads' directory to store resumes
os.makedirs("uploads", exist_ok=True)

app = FastAPI()

# ... Your CORS middleware remains here ...
# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# This allows your future React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Structure for the interview session
class InterviewSession(BaseModel):
    interview_type: str
    role_domain: str
    difficulty: str
    topic_count: int

@app.get("/")
def read_root():
    return {"message": "Welcome to the SmartHire AI Backend!"}


@app.post("/api/create-session/")
def create_session(session_data: InterviewSession, db: Session = Depends(get_db)):
    # 1. Map the incoming JSON data to our database model
    new_session = models.InterviewSession(
        interview_type=session_data.interview_type,
        role=session_data.role_domain, # Pulling from your Pydantic model
        difficulty=session_data.difficulty,
        topic_count=session_data.topic_count
    )
    
    # 2. Add and save the new record to the SQLite database
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    # 3. Return a success message with the newly generated database ID
    return {
        "message": "Session created successfully!", 
        "session_id": new_session.id
    }

# NEW: Endpoint for uploading resumes
@app.post("/api/upload-resume/")
def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 1. Define exactly where the file will be saved
    file_path = f"uploads/{file.filename}"
    
    # 2. Save the physical PDF/DOCX file to your computer
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 3. Map the file details to our database model
    new_resume = models.Resume(
        filename=file.filename,
        file_path=file_path
    )
    
    # 4. Save the new record to the SQLite database
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)
    
    # 5. Return success message and the database ID
    return {
        "message": "Resume uploaded and saved to database successfully!",
        "resume_id": new_resume.id,
        "filename": file.filename
    }

@app.get("/api/sessions/")
def get_all_sessions(db: Session = Depends(get_db)):
    # This asks the database for every session record it has
    sessions = db.query(models.InterviewSession).all()
    return {"sessions": sessions}

@app.get("/api/resumes/")
def get_all_resumes(db: Session = Depends(get_db)):
    # This asks the database for every uploaded resume record
    resumes = db.query(models.Resume).all()
    return {"resumes": resumes}