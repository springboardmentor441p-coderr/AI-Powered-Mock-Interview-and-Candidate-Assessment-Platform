import os
from fastapi.responses import FileResponse

from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi import Request
from dashboard import get_dashboard_stats
from skill_gap import analyze_skill_gap
from interview_generator import generate_questions
from job_matcher import recommend_jobs
from ats_score import calculate_score
from ai_resume_parser import extract_resume_details
from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from database import engine, SessionLocal
from models import Base, User
from schemas import UserCreate, UserLogin
from auth import hash_password, verify_password
from resume_parser import extract_text

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartHire AI Backend",
    version="1.0"
)
templates = Jinja2Templates(directory="templates")

# -------------------------
# Database Dependency
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------------
# Home API
# -------------------------
from fastapi.responses import FileResponse
import os

# -------------------------
# Home API
# -------------------------
@app.get("/")
def home():
    return FileResponse(
        os.path.join("templates", "index.html")
    )
# -------------------------
# Register API
# -------------------------
@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_pwd = hash_password(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_pwd,
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User Registered Successfully!"
    }


# -------------------------
# Login API
# -------------------------
@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid Password"
        )

    return {
        "message": "Login Successful",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "role": db_user.role
        }
    }


# -------------------------
# Upload Resume API
# -------------------------
@app.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...)):

    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    text = extract_text(file.file)
    print("TEXT:", text[:300])

    details = extract_resume_details(text)
    print("DETAILS:", details)

    ats = calculate_score(details)
    print("ATS:", ats)

    recommended_jobs = recommend_jobs(details.get("skills", []))
    interview_questions = generate_questions(details["skills"])
    print("JOBS:", recommended_jobs)

    return {
        "filename": file.filename,
        "resume_data": details,
        "ats_score": ats,
        "recommended_jobs": recommended_jobs,
        "interview_questions": interview_questions,
        "raw_text": text
    }
@app.post("/skill_gap")
def skill_gap_analysis(data: dict):

    user_skills = data.get("skills", [])
    target_job = data.get("target_job", "")

    result = analyze_skill_gap(user_skills, target_job)

    return result
# -------------------------
# Dashboard API
# -------------------------
@app.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):

    stats = get_dashboard_stats(db)

    return stats
