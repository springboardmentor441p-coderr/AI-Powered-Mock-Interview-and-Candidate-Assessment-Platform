import os
import shutil
import PyPDF2
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

class InterviewChat(BaseModel):
    role_domain: str
    difficulty: str
    current_question: str
    user_answer: str

    # Add this model near the top where your other models are
class InterviewStart(BaseModel):
    role_domain: str
    difficulty: str
    resume_skills: str

# Load environment variables
load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

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
    import json # <-- Ensure this is near the top of main.py with the other imports

# ==========================================
# AI Helper Function: Read PDFs
# ==========================================
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

# ==========================================
# 1. Resume Analyzer Endpoint (Gemini)
# ==========================================
@app.post("/api/analyze-resume/{resume_id}")
def analyze_resume(resume_id: int, db: Session = Depends(get_db)):
    # 1. Find the resume in the database
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        return {"error": "Resume not found in the database."}

    # 2. Extract the raw text from the physical file
    raw_text = extract_text_from_pdf(resume.file_path)
    if not raw_text:
        return {"error": "Could not extract text from the file. It might be empty or corrupted."}

    # 3. Send the text to Gemini to extract skills
    prompt = f"Extract a comma-separated list of the top 10 technical skills from this candidate's resume text. Only return the skills, nothing else: {raw_text[:3000]}"
    
    try:
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
# 2. Live Interview Chat Endpoint (Gemini)
# ==========================================
@app.post("/api/interview/chat")
def process_interview_chat(chat_data: InterviewChat):
    try:
        model = genai.GenerativeModel('gemini-3.6-flash')
        
        prompt = f"""
        You are an expert technical interviewer for a {chat_data.difficulty} level {chat_data.role_domain} position.
        
        The candidate was just asked this question: "{chat_data.current_question}"
        The candidate provided this answer: "{chat_data.user_answer}"
        
        Your task is to provide a single JSON response with three exact keys:
        1. "feedback": A brief evaluation of their answer. Include a quick note on their technical communication, grammar, and vocabulary usage.
        2. "score": A score out of 10 for their answer.
        3. "next_question": Generate the next relevant interview question to keep the conversation going.
        
        Return ONLY valid JSON. No markdown, no extra text.
        """
        
        response = model.generate_content(prompt)
        ai_response_text = response.text.strip()
        
        if ai_response_text.startswith("```json"):
            ai_response_text = ai_response_text[7:-3].strip()
            
        import json
        parsed_response = json.loads(ai_response_text)
        return parsed_response
        
    except Exception as e:
        return {"error": f"Failed to process chat: {str(e)}"}

# Add this endpoint at the very bottom of main.py
@app.post("/api/interview/start")
def start_interview(data: InterviewStart):
    try:
        model = genai.GenerativeModel('gemini-3.6-flash')
        
        prompt = f"""
        You are an expert technical interviewer for a {data.difficulty} level {data.role_domain} position.
        The candidate's resume highlights these specific skills: {data.resume_skills}.
        
        Generate a single, professional opening technical interview question that asks the candidate to explain their experience with one or two of these specific skills.
        
        Return ONLY the question text. Do not include quotes, greetings, or any other formatting.
        """
        
        response = model.generate_content(prompt)
        first_question = response.text.strip()
        
        return {"question": first_question}
        
    except Exception as e:
        return {"error": f"Failed to generate opening question: {str(e)}"}