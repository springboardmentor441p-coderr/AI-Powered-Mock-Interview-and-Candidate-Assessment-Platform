import os
import shutil
import PyPDF2
import json
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import engine, SessionLocal
import models

# ==========================================
# PYDANTIC MODELS
# ==========================================
class InterviewChat(BaseModel):
    role_domain: str
    difficulty: str
    current_question: str
    user_answer: str

class InterviewStart(BaseModel):
    role_domain: str
    difficulty: str
    resume_skills: str

class InterviewResult(BaseModel):
    user_id: int = 1
    role_domain: str
    score: int
    feedback_summary: list[str]
    eye_contact: int
    confidence: int
    posture: str

class UserAuth(BaseModel):
    email_or_mobile: str
    password: str

class InterviewSessionData(BaseModel):
    interview_type: str
    role_domain: str
    difficulty: str
    topic_count: int

# ==========================================
# SETUP & CONFIGURATION
# ==========================================
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

models.Base.metadata.create_all(bind=engine)
os.makedirs("uploads", exist_ok=True)

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# AUTHENTICATION ENDPOINTS
# ==========================================
@app.get("/")
def read_root():
    return {"message": "Welcome to the SmartHire AI Backend!"}

@app.post("/api/signup")
def signup(user_data: UserAuth, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email_or_mobile == user_data.email_or_mobile).first()
    if existing_user:
        return {"error": "Account already exists! Please log in."}
    
    new_user = models.User(email_or_mobile=user_data.email_or_mobile, password=user_data.password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Signup successful!", "user_id": new_user.id}

@app.post("/api/login")
def login(user_data: UserAuth, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email_or_mobile == user_data.email_or_mobile).first()
    
    if not user:
        return {"error": "Account not found. Please sign up first."}
        
    if user.password != user_data.password:
        return {"error": "Wrong password. Please try again."}
        
    return {"message": "Login successful!", "user_id": user.id}

# ==========================================
# RESUME ENDPOINTS
# ==========================================
@app.post("/api/upload-resume/")
def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_path = f"uploads/{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    new_resume = models.Resume(filename=file.filename, file_path=file_path)
    db.add(new_resume)
    db.commit()
    db.refresh(new_resume)
    
    return {
        "message": "Resume uploaded successfully!",
        "resume_id": new_resume.id,
        "filename": file.filename
    }

@app.get("/api/user/resumes")
def get_user_resumes(user_id: int = 1, db: Session = Depends(get_db)):
    resumes = db.query(models.Resume).all() 
    if not resumes:
        return {"resumes": []}
    return {"resumes": [{"id": r.id, "filename": r.filename, "file_path": r.file_path} for r in resumes]}

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    try:
        with open(file_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                if page.extract_text():
                    text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

@app.post("/api/analyze-resume/{resume_id}")
def analyze_resume(resume_id: int, db: Session = Depends(get_db)):
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        return {"error": "Resume not found in the database."}

    raw_text = extract_text_from_pdf(resume.file_path)
    if not raw_text:
        return {"error": "Could not extract text from the file."}

    prompt = f"Extract a comma-separated list of the top 10 technical skills from this candidate's resume text. Only return the skills, nothing else: {raw_text[:3000]}"
    
    try:
        # Kept the model exactly as you requested
        model = genai.GenerativeModel('gemini-3.6-flash')
        response = model.generate_content(prompt)
        extracted_skills = response.text.strip()
        
        return {
            "message": "Resume analyzed successfully!",
            "filename": resume.filename,
            "skills": extracted_skills
        }
    except Exception as e:
        return {"error": f"Gemini API Error: {str(e)}"}

# ==========================================
# INTERVIEW AI ENDPOINTS
# ==========================================
@app.post("/api/interview/start")
def start_interview(data: InterviewStart):
    try:
        # Kept the model exactly as you requested
        model = genai.GenerativeModel('gemini-3.6-flash')
        
        prompt = f"""
        You are an expert, friendly human interviewer conducting an interview for a {data.role_domain} position.
        The difficulty level is {data.difficulty}.
        Candidate's Resume/Skills Context: {data.resume_skills}

        INSTRUCTIONS FOR YOUR FIRST MESSAGE:
        1. Act perfectly human, warm, and welcoming. Do not sound like an AI.
        2. DO NOT ask any technical questions yet.
        3. Welcome the candidate and ask them to introduce themselves.
        4. Keep your response short (1-2 sentences).
        """
        
        response = model.generate_content(prompt)
        first_question = response.text.strip()
        
        return {"question": first_question}
        
    except Exception as e:
        return {"error": f"Failed to generate opening question: {str(e)}"}

@app.post("/api/interview/chat")
def process_interview_chat(chat_data: InterviewChat):
    try:
        # Kept the model exactly as you requested
        model = genai.GenerativeModel('gemini-3.6-flash')

        # FIX: Added strict JSON formatting instructions so Python doesn't crash when decoding
        prompt = f"""
        You are an expert technical interviewer for a {chat_data.difficulty} level {chat_data.role_domain} position.
        
        The candidate was just asked: "{chat_data.current_question}"
        The candidate answered: "{chat_data.user_answer}"
        
        Your task is to provide a single JSON response with EXACTLY these three keys:
        1. "feedback": A brief, conversational response to their answer.
        2. "score": A score out of 10 for their answer (integer only).
        3. "next_question": Generate the next relevant interview question.
        
        Return ONLY valid JSON. No markdown, no conversational filler outside the JSON.
        """
        
        response = model.generate_content(prompt)
        ai_response_text = response.text.strip()
        
        if ai_response_text.startswith("```json"):
            ai_response_text = ai_response_text[7:-3].strip()
        elif ai_response_text.startswith("```"):
            ai_response_text = ai_response_text[3:-3].strip()
            
        parsed_response = json.loads(ai_response_text)
        return parsed_response
        
    except Exception as e:
        return {"error": f"Failed to process chat: {str(e)}"}

@app.post("/api/interview/finish")
def save_interview_results(result: InterviewResult, db: Session = Depends(get_db)):
    try:
        # FIX: Corrected column names to match standard database models
        new_session = models.InterviewSession(
            user_id=result.user_id,
            role=result.role_domain, 
            score=result.score,
            interview_type="Live",
            difficulty="Unknown",
            topic_count=len(result.feedback_summary)
        )
        
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        return {"message": "Interview results safely stored in the database!"}
        
    except Exception as e:
        return {"error": f"Failed to save results: {str(e)}"}

# ==========================================
# ANALYTICS & HISTORY ENDPOINTS
# ==========================================
@app.get("/api/user/dashboard-stats")
def get_dashboard_stats(user_id: int = 1, db: Session = Depends(get_db)):
    sessions = db.query(models.InterviewSession).filter(models.InterviewSession.user_id == user_id).all()
    
    if not sessions:
        return {
            "overallPerformance": 0,
            "totalSessions": 0,
            "bestScore": 0,
            "avgScore": 0,
            "communicationScore": 0
        }
        
    total_sessions = len(sessions)
    scores = [session.score for session in sessions if hasattr(session, 'score') and session.score is not None]
    
    best_score = max(scores) if scores else 0
    avg_score = round(sum(scores) / len(scores)) if scores else 0
    comm_score = min(100, avg_score + 10) if scores else 0
    
    return {
        "overallPerformance": avg_score, 
        "totalSessions": total_sessions,
        "bestScore": best_score,
        "avgScore": avg_score,
        "communicationScore": comm_score
    }

@app.get("/api/user/history")
def get_user_history(user_id: int = 1, db: Session = Depends(get_db)):
    sessions = db.query(models.InterviewSession).filter(models.InterviewSession.user_id == user_id).order_by(models.InterviewSession.id.desc()).all()
    
    history_list = []
    for s in sessions:
        score = s.score if hasattr(s, 'score') and s.score is not None else 0
        history_list.append({
            "id": s.id,
            "role": getattr(s, 'role', 'Unknown'),
            "date": "Recently Completed", 
            "duration": "15m 00s",
            "score": score,
            "status": "Completed" if score > 0 else "Aborted"
        })
        
    return {"history": history_list}