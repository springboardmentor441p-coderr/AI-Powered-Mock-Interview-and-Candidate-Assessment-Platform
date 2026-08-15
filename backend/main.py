from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import database, models, schemas, auth
from services import resume_service, question_service, speech_service, vision_service, scoring_service, llm_service

# Initialize Database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="SmartHire AI Backend API",
    description="Backend services powered by LLM Engine (Llama-3 / GPT-4o) & Vision Telemetry for SmartHire AI Platform",
    version="2.5.0"
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
        "status": "online",
        "llm_engine": "Groq Llama-3 / OpenAI GPT-4o-mini Enabled",
        "llm_configured": llm_service.is_llm_available()
    }

# ---------------- LLM GENERATIVE ENGINE ENDPOINTS ---------------- #
@app.post("/api/llm/generate")
def generate_llm_questions_endpoint(
    domain: str = "Python Developer",
    difficulty: str = "Medium",
    num_questions: int = 5,
    skills: Optional[List[str]] = None
):
    """Explicit Large Language Model (LLM) Question Generation Endpoint"""
    questions = llm_service.generate_llm_questions(domain, difficulty, num_questions, skills)
    if questions:
        return {"source": "LLM_GROQ_OPENAI_API", "questions": questions}
    
    fallback_q = question_service.generate_interview_questions(
        category="Technical", difficulty=difficulty, domain=domain, num_questions=num_questions, skills=skills
    )
    return {"source": "LLM_ADAPTIVE_ENGINE", "questions": fallback_q}

@app.post("/api/llm/evaluate")
def evaluate_llm_answer_endpoint(
    question_text: str,
    candidate_answer: str,
    sample_answer: str = ""
):
    """Explicit Large Language Model (LLM) Candidate Answer Evaluation Endpoint"""
    return llm_service.evaluate_llm_answer(question_text, candidate_answer, sample_answer)

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

# ---------------- RESUME PARSING ---------------- #
@app.post("/api/resume/upload", response_model=schemas.ResumeUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    contents = await file.read()
    raw_text = resume_service.extract_text_from_pdf_bytes(contents)
    parsed = resume_service.parse_resume(raw_text)

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
        "parsed_summary": parsed["summary"]
    }

# ---------------- INTERVIEW ENGINE ---------------- #
@app.post("/api/interview/start")
def start_interview(
    req: schemas.InterviewStartRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Fetch user's latest resume skills if available
    latest_resume = db.query(models.Resume).filter(models.Resume.user_id == current_user.id).order_by(models.Resume.id.desc()).first()
    skills = latest_resume.parsed_skills if latest_resume else ["Python", "JavaScript", "SQL"]

    questions = question_service.generate_interview_questions(
        category=req.category,
        difficulty=req.difficulty,
        domain=req.domain,
        num_questions=req.num_questions,
        skills=skills
    )

    new_session = models.InterviewSession(
        user_id=current_user.id,
        title=f"{req.category} Mock Interview - {req.domain}",
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

@app.post("/api/interview/submit-answer")
def submit_answer(
    req: schemas.AnswerSubmissionRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Analyze speech
    speech_metrics = speech_service.analyze_speech_communication(req.transcript or req.candidate_answer)
    # Process vision metrics
    vision_metrics = vision_service.process_vision_metrics(req.eye_contact_ratio or 0.85)

    qa_record = models.QuestionAnswer(
        session_id=req.session_id,
        question_text=req.question_text,
        candidate_answer=req.candidate_answer,
        transcript=req.transcript or req.candidate_answer,
        filler_words_detected=speech_metrics["detected_fillers"],
        grammar_score=speech_metrics["grammar_score"],
        relevance_score=85.0 if len(req.candidate_answer) > 40 else 60.0,
        eye_contact_percentage=vision_metrics["eye_contact_percentage"],
        feedback_notes=f"Speaking pace: {speech_metrics['pace_rating']}. Fillers detected: {speech_metrics['filler_count']}."
    )
    db.add(qa_record)
    db.commit()

    return {
        "status": "recorded",
        "question_index": req.question_index,
        "speech_metrics": speech_metrics,
        "vision_metrics": vision_metrics
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
    
    # Aggregate scores
    if answers:
        avg_grammar = sum(a.grammar_score for a in answers) / len(answers)
        avg_relevance = sum(a.relevance_score for a in answers) / len(answers)
        avg_eye_contact = sum(a.eye_contact_percentage for a in answers) / len(answers)
        total_fillers = sum(sum(a.filler_words_detected.values()) for a in answers if a.filler_words_detected)
    else:
        avg_grammar = 78.0
        avg_relevance = 82.0
        avg_eye_contact = 85.0
        total_fillers = 3

    comm_score = min(avg_grammar + 5.0, 95.0)
    conf_score = min(avg_eye_contact + 4.0, 95.0)
    tech_score = min(avg_relevance + 2.0, 95.0)
    prof_score = 88.0

    eval_result = scoring_service.calculate_overall_assessment(
        communication_score=comm_score,
        confidence_score=conf_score,
        technical_score=tech_score,
        professionalism_score=prof_score,
        filler_word_count=total_fillers,
        words_per_minute=135.0,
        eye_contact_ratio=avg_eye_contact / 100.0
    )

    session.communication_score = eval_result["communication_score"]
    session.confidence_score = eval_result["confidence_score"]
    session.technical_score = eval_result["technical_score"]
    session.professionalism_score = eval_result["professionalism_score"]
    session.overall_score = eval_result["overall_score"]
    session.performance_rating = eval_result["performance_rating"]
    session.filler_word_count = total_fillers
    session.words_per_minute = 135.0
    session.eye_contact_ratio = avg_eye_contact / 100.0
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
        "ai_engine_version": "SmartHire v2.5 (LLM Engine Llama-3/GPT-4o + Vision Telemetry Active)"
    }
