import os
import logging
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Ensure .env is loaded cleanly from backend/.env or root .env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
ENV_FILE_BACKEND = os.path.join(BASE_DIR, ".env")
ENV_FILE_ROOT = os.path.join(PROJECT_ROOT, ".env")

if os.path.exists(ENV_FILE_BACKEND):
    load_dotenv(ENV_FILE_BACKEND)
elif os.path.exists(ENV_FILE_ROOT):
    load_dotenv(ENV_FILE_ROOT)
else:
    load_dotenv()

import database, models, schemas, auth
from services import resume_service, question_service, speech_service, vision_service, scoring_service, llm_service

# Initialize Database tables
models.Base.metadata.create_all(bind=database.engine)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smarthire")

app = FastAPI(
    title="SmartHire AI Backend API",
    description="Backend services powered by Groq LLM (openai/gpt-oss-120b) & Mira AI Interviewer Engine for SmartHire-AI",
    version="3.1.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "SmartHire AI Backend API Server Running",
        "interviewer": "Mira AI Interviewer",
        "status": "online",
        "llm_provider": "Groq",
        "llm_model": os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
        "llm_available": llm_service.is_llm_available()
    }

# ---------------- TRUTHFUL SYSTEM READINESS CHECK ---------------- #
@app.get("/api/system/check")
def system_check_endpoint(db: Session = Depends(database.get_db)):
    db_status = "Connected"
    try:
        db.execute(models.User.__table__.select().limit(1))
    except Exception as e:
        db_status = f"Database Error: {str(e)}"

    llm_configured = llm_service.is_llm_available()
    llm_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

    return {
        "backend_status": "Online",
        "database_status": db_status,
        "llm_provider": "Groq",
        "llm_model": llm_model,
        "llm_configured": llm_configured,
        "resume_parsing_available": True,
        "interviewer": "Mira"
    }

# ---------------- LLM GENERATIVE ENGINE ENDPOINTS ---------------- #
@app.post("/api/llm/generate")
def generate_llm_questions_endpoint(
    domain: str = "Python Developer",
    difficulty: str = "Medium",
    num_questions: int = 5,
    skills: Optional[List[str]] = None,
    previous_questions: Optional[List[str]] = None,
    previous_candidate_answer: str = "",
    resume_text: str = ""
):
    """Dynamically generate unique interview questions using Groq LLM (openai/gpt-oss-120b)."""
    questions = llm_service.generate_llm_questions(
        domain=domain,
        difficulty=difficulty,
        num_questions=num_questions,
        skills=skills,
        previous_questions=previous_questions or [],
        previous_candidate_answer=previous_candidate_answer,
        resume_text=resume_text
    )
    if questions:
        return {"source": "GROQ_LLM", "model": llm_service.GROQ_MODEL, "questions": questions}
    
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Unable to start the AI interview. Please try again."
    )

@app.post("/api/llm/next-question")
def generate_next_question_endpoint(payload: Dict[str, Any]):
    """
    Generates 1 adaptive follow-up question based on candidate's previous answer and session history.
    Guarantees no repetition against previous questions.
    """
    domain = payload.get("domain", "Python Developer")
    difficulty = payload.get("difficulty", "Medium")
    skills = payload.get("skills", [])
    previous_questions = payload.get("previous_questions", [])
    candidate_answer = payload.get("candidate_answer", "")
    resume_text = payload.get("resume_text", "")

    next_q = llm_service.generate_single_adaptive_question(
        domain=domain,
        difficulty=difficulty,
        skills=skills,
        previous_questions=previous_questions,
        candidate_answer=candidate_answer,
        resume_text=resume_text
    )

    if next_q:
        return {"source": "GROQ_LLM", "model": llm_service.GROQ_MODEL, "question": next_q}

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Unable to generate next adaptive question. Please try again."
    )

@app.post("/api/llm/evaluate")
def evaluate_llm_answer_endpoint(
    question_text: str,
    candidate_answer: str,
    sample_answer: str = ""
):
    """Evaluate candidate answer using Groq LLM (openai/gpt-oss-120b)."""
    if not candidate_answer or candidate_answer.strip() in ["", "Not answered", "[Candidate skipped question without speaking]"]:
        return {
            "evaluation_status": "Unanswered",
            "is_answered": False,
            "technical_score": 0.0,
            "clarity_score": 0.0,
            "relevance_score": 0.0,
            "completeness_score": 0.0,
            "feedback": "Question was skipped without a spoken or written response.",
            "strengths": [],
            "weaknesses": ["Question skipped without an answer."]
        }

    eval_res = llm_service.evaluate_llm_answer(question_text, candidate_answer, sample_answer)
    eval_res["evaluation_status"] = "Answered"
    eval_res["is_answered"] = True
    return eval_res

# ---------------- USER AUTHENTICATION ---------------- #
@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(database.get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")
    
    hashed_pwd = auth.get_password_hash(user_in.password)
    new_user = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_pwd,
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login_user(user_in: schemas.UserLogin, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not user or not auth.verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = auth.create_access_token({"sub": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# ---------------- RESUME PARSING & ATS ANALYZER ---------------- #
@app.post("/api/resume/upload")
async def upload_resume(
    file: UploadFile = File(...),
    job_description: Optional[str] = Form(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    contents = await file.read()
    raw_text = resume_service.extract_text_from_pdf_bytes(contents)
    parsed = resume_service.analyze_resume_ats(raw_text, job_description)

    if not parsed.get("extraction_successful") and not parsed.get("skills"):
        logger.warning("Resume parse returned no skills for file: %s", file.filename)

    resume_record = models.Resume(
        user_id=current_user.id,
        filename=file.filename,
        parsed_skills=parsed["skills"],
        parsed_experience=parsed["experience"],
        parsed_education=parsed["education"],
        parsed_summary=parsed["summary"]
    )
    db.add(resume_record)
    db.commit()
    db.refresh(resume_record)

    return {
        "id": resume_record.id,
        "filename": file.filename,
        "parsed_skills": parsed["skills"],
        "parsed_experience": parsed["experience"],
        "parsed_education": parsed["education"],
        "parsed_summary": parsed["summary"],
        "ats_score": parsed.get("ats_score", 80),
        "strengths": parsed.get("strengths", []),
        "weaknesses": parsed.get("weaknesses", []),
        "missing_skills": parsed.get("missing_skills", []),
        "suggestions": parsed.get("suggestions", [])
    }

# ---------------- INTERVIEW ENGINE ---------------- #
@app.post("/api/interview/start")
def start_interview(
    req: schemas.InterviewStartRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    latest_resume = db.query(models.Resume).filter(models.Resume.user_id == current_user.id).order_by(models.Resume.id.desc()).first()
    skills = latest_resume.parsed_skills if (latest_resume and latest_resume.parsed_skills) else None

    # Call dynamic LLM question generator
    questions = question_service.generate_interview_questions(
        category=req.category,
        difficulty=req.difficulty,
        domain=req.domain,
        num_questions=req.num_questions,
        skills=skills
    )

    if not questions:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to start the AI interview. Please try again."
        )

    new_session = models.InterviewSession(
        user_id=current_user.id,
        title=f"{req.category} Interview with Mira ({req.domain})",
        category=req.category,
        difficulty=req.difficulty,
        domain=req.domain,
        total_questions=len(questions),
        status="in_progress"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return {
        "session_id": new_session.id,
        "title": new_session.title,
        "category": req.category,
        "difficulty": req.difficulty,
        "domain": req.domain,
        "questions": questions
    }

@app.post("/api/speech/transcribe")
async def transcribe_audio_endpoint(file: UploadFile = File(...)):
    """Transcribe recorded candidate audio using Groq Whisper API (whisper-large-v3)."""
    try:
        audio_bytes = await file.read()
        if not audio_bytes or len(audio_bytes) < 100:
            return {"transcript": "", "status": "empty_audio"}
            
        transcript = speech_service.transcribe_audio_bytes(audio_bytes, file.filename or "recording.webm")
        return {
            "transcript": transcript,
            "status": "success" if transcript else "no_speech_detected"
        }
    except Exception as e:
        logger.error(f"Audio transcription endpoint error: {str(e)}")
        return {"transcript": "", "error": str(e), "status": "error"}

@app.post("/api/interview/submit-answer")
def submit_answer(
    req: schemas.AnswerSubmissionRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    is_answered = bool(req.candidate_answer and req.candidate_answer.strip() and req.candidate_answer.strip() not in ["Not answered", "[Candidate skipped question without speaking]"])
    final_text = req.candidate_answer.strip() if is_answered else "Not answered"

    speech_metrics = speech_service.analyze_speech_communication(req.transcript or final_text)
    vision_metrics = vision_service.process_vision_metrics(req.eye_contact_ratio or 0.0)

    # Evaluate answer via Groq LLM
    if is_answered:
        llm_eval = llm_service.evaluate_llm_answer(
            question_text=req.question_text,
            candidate_answer=final_text,
            sample_answer=""
        )
        llm_eval["is_answered"] = True
        llm_eval["evaluation_status"] = "Answered"
        tech_score = float(llm_eval.get("technical_score", 0.0))
        clarity_score = float(llm_eval.get("clarity_score", 0.0))
    else:
        llm_eval = {
            "evaluation_status": "Unanswered",
            "is_answered": False,
            "technical_score": 0.0,
            "clarity_score": 0.0,
            "relevance_score": 0.0,
            "completeness_score": 0.0,
            "feedback": "Question was skipped without a spoken answer.",
            "strengths": [],
            "weaknesses": ["Question skipped without an answer."]
        }
        tech_score = 0.0
        clarity_score = 0.0

    qa_record = models.QuestionAnswer(
        session_id=req.session_id,
        question_text=req.question_text,
        candidate_answer=final_text,
        transcript=final_text,
        filler_words_detected=speech_metrics["detected_fillers"],
        grammar_score=speech_metrics["grammar_score"] if is_answered else 0.0,
        relevance_score=tech_score,
        eye_contact_percentage=vision_metrics["eye_contact_percentage"],
        feedback_notes=llm_eval.get("feedback", "Evaluation recorded.")
    )
    db.add(qa_record)
    db.commit()

    return {
        "status": "recorded",
        "question_index": req.question_index,
        "is_answered": is_answered,
        "candidate_answer": final_text,
        "speech_metrics": speech_metrics,
        "vision_metrics": vision_metrics,
        "llm_evaluation": llm_eval
    }

@app.post("/api/interview/finish/{session_id}")
def finish_interview(
    session_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    session = db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    answers = db.query(models.QuestionAnswer).filter(models.QuestionAnswer.session_id == session_id).all()
    
    answered_list = [a for a in answers if a.candidate_answer and a.candidate_answer != "Not answered"]
    unanswered_count = len(answers) - len(answered_list)

    if answered_list:
        avg_grammar = sum(a.grammar_score for a in answered_list) / len(answered_list)
        avg_relevance = sum(a.relevance_score for a in answered_list) / len(answered_list)
        avg_eye_contact = sum(a.eye_contact_percentage for a in answered_list) / len(answered_list)
        total_fillers = sum(sum(a.filler_words_detected.values()) for a in answered_list if a.filler_words_detected)
    else:
        avg_grammar = 0.0
        avg_relevance = 0.0
        avg_eye_contact = 0.0
        total_fillers = 0

    comm_score = min(avg_grammar + 5.0, 100.0) if answered_list else 0.0
    conf_score = min(avg_eye_contact + 4.0, 100.0) if answered_list else 0.0
    tech_score = avg_relevance if answered_list else 0.0
    prof_score = 85.0 if answered_list else 0.0

    eval_result = scoring_service.calculate_overall_assessment(
        communication_score=comm_score,
        confidence_score=conf_score,
        technical_score=tech_score,
        professionalism_score=prof_score,
        filler_word_count=total_fillers,
        words_per_minute=135.0 if answered_list else 0.0,
        eye_contact_ratio=avg_eye_contact / 100.0 if avg_eye_contact > 0 else 0.0
    )

    eval_result["answered_questions_count"] = len(answered_list)
    eval_result["unanswered_questions_count"] = unanswered_count
    eval_result["total_questions_count"] = len(answers)

    session.communication_score = eval_result["communication_score"]
    session.confidence_score = eval_result["confidence_score"]
    session.technical_score = eval_result["technical_score"]
    session.professionalism_score = eval_result["professionalism_score"]
    session.overall_score = eval_result["overall_score"]
    session.performance_rating = eval_result["performance_rating"]
    session.filler_word_count = total_fillers
    session.words_per_minute = 135.0 if answered_list else 0.0
    session.eye_contact_ratio = avg_eye_contact / 100.0 if avg_eye_contact > 0 else 0.0
    session.strengths = eval_result["strengths"]
    session.weaknesses = eval_result["weaknesses"]
    session.improvement_tips = eval_result["improvement_tips"]
    session.status = "completed"

    db.commit()
    db.refresh(session)

    return eval_result

# ---------------- DASHBOARDS & ANALYTICS ---------------- #
@app.get("/api/candidate/dashboard")
def candidate_dashboard(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    sessions = db.query(models.InterviewSession).filter(models.InterviewSession.user_id == current_user.id).all()
    resumes = db.query(models.Resume).filter(models.Resume.user_id == current_user.id).all()

    completed = [s for s in sessions if s.status == "completed"]
    avg_score = round(sum(s.overall_score for s in completed) / len(completed), 1) if completed else 0.0

    recent_sessions = [
        {
            "id": s.id,
            "title": s.title,
            "category": s.category,
            "difficulty": s.difficulty,
            "overall_score": s.overall_score,
            "performance_rating": s.performance_rating,
            "created_at": s.created_at.strftime("%Y-%m-%d %H:%M")
        } for s in reversed(sessions[:10])
    ]

    return {
        "user_name": current_user.full_name,
        "total_interviews": len(sessions),
        "completed_interviews": len(completed),
        "average_overall_score": avg_score,
        "resumes_uploaded": len(resumes),
        "recent_sessions": recent_sessions,
        "skill_breakdown": [
            {"skill": "Communication", "score": round(sum(s.communication_score for s in completed)/max(len(completed),1),1)},
            {"skill": "Confidence", "score": round(sum(s.confidence_score for s in completed)/max(len(completed),1),1)},
            {"skill": "Technical Accuracy", "score": round(sum(s.technical_score for s in completed)/max(len(completed),1),1)},
            {"skill": "Professionalism", "score": round(sum(s.professionalism_score for s in completed)/max(len(completed),1),1)}
        ]
    }

@app.get("/api/recruiter/analytics")
def recruiter_analytics(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    all_sessions = db.query(models.InterviewSession).all()
    all_users = db.query(models.User).filter(models.User.role == "candidate").all()

    candidates_evaluated = len(all_users)
    avg_score_platform = round(sum(s.overall_score for s in all_sessions if s.status == "completed") / max(len(all_sessions), 1), 1)

    candidate_cards = []
    for user in all_users[:15]:
        user_sess = [s for s in all_sessions if s.user_id == user.id and s.status == "completed"]
        best_score = max([s.overall_score for s in user_sess], default=0.0)
        candidate_cards.append({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "interviews_attended": len(user_sess),
            "highest_score": best_score,
            "status": "Ready for Hire" if best_score >= 80 else "In Preparation"
        })

    return {
        "total_candidates": candidates_evaluated,
        "average_platform_score": avg_score_platform,
        "candidates": candidate_cards
    }

@app.get("/api/admin/metrics")
def admin_metrics(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    users_count = db.query(models.User).count()
    sessions_count = db.query(models.InterviewSession).count()
    resumes_count = db.query(models.Resume).count()

    return {
        "total_users": users_count,
        "total_sessions": sessions_count,
        "total_resumes_parsed": resumes_count,
        "system_status": "Healthy / Operational",
        "ai_engine_version": "SmartHire v3.1 (Groq LLM openai/gpt-oss-120b + Mira Active)"
    }
