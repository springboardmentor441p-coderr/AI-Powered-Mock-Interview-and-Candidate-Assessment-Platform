import os
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Query
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
database.sync_database_schema()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("smarthire")

app = FastAPI(
    title="SmartHire AI Backend API",
    description="Backend services powered by Groq LLM (openai/gpt-oss-120b) & Mira AI Interviewer Engine for SmartHire-AI",
    version="3.2.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- SYSTEM CHECK ---------------- #
@app.get("/api/system/check")
def system_check(db: Session = Depends(database.get_db)):
    db_ok = True
    try:
        db.execute(database.text("SELECT 1"))
    except Exception as e:
        db_ok = False
        logger.warning(f"Database healthcheck failed: {e}")

    llm_key = os.getenv("GROQ_API_KEY", "")
    llm_configured = bool(llm_key and len(llm_key) > 10)

    return {
        "backend_status": "Online",
        "database_status": "Connected" if db_ok else "Degraded",
        "llm_provider": "Groq",
        "llm_model": os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
        "llm_configured": llm_configured,
        "resume_parsing_available": True,
        "interviewer": "Mira"
    }

# ---------------- AUTHENTICATION ---------------- #
@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_pwd,
        role=user.role or "candidate"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    if not db_user or not auth.verify_password(user_credentials.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": db_user.email, "role": db_user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# ---------------- RESUME PARSER ---------------- #
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
    try:
        category = req.category or "Technical Interview"
        difficulty = req.difficulty or "Medium"
        domain = req.domain or "Python Developer"
        num_questions = req.num_questions or 5

        latest_resume = db.query(models.Resume).filter(models.Resume.user_id == current_user.id).order_by(models.Resume.id.desc()).first()
        skills = latest_resume.parsed_skills if (latest_resume and latest_resume.parsed_skills) else None

        # Call dynamic LLM question generator (guaranteed to return list starting with Q1 self-introduction)
        questions = question_service.generate_interview_questions(
            category=category,
            difficulty=difficulty,
            domain=domain,
            num_questions=num_questions,
            skills=skills
        )

        now_utc = datetime.utcnow()

        new_session = models.InterviewSession(
            user_id=current_user.id,
            title=f"{category} Interview with Mira ({domain})",
            category=category,
            difficulty=difficulty,
            domain=domain,
            total_questions=len(questions),
            status="active",
            ended_reason="in_progress",
            started_at=now_utc,
            questions_data=questions
        )
        try:
            db.add(new_session)
            db.commit()
            db.refresh(new_session)
        except Exception as db_err:
            db.rollback()
            logger.warning("Retry creating interview session after rollback: %s", db_err)
            db.add(new_session)
            db.commit()
            db.refresh(new_session)

        return {
            "session_id": new_session.id,
            "title": new_session.title,
            "category": new_session.category,
            "difficulty": new_session.difficulty,
            "domain": new_session.domain,
            "status": new_session.status,
            "started_at": new_session.started_at.isoformat(),
            "candidate": {
                "id": current_user.id,
                "full_name": current_user.full_name,
                "email": current_user.email,
                "role": current_user.role
            },
            "questions": questions
        }
    except Exception as exc:
        logger.exception("Error in start_interview endpoint: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to start the interview. Please try again."
        )

@app.get("/api/interview/session/{session_id}")
def get_interview_session(
    session_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    session = db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    answers = db.query(models.QuestionAnswer).filter(models.QuestionAnswer.session_id == session_id).order_by(models.QuestionAnswer.question_index.asc()).all()

    answers_history = [
        {
            "q_num": a.question_index,
            "q_text": a.question_text,
            "user_answer": a.candidate_answer,
            "is_answered": bool(a.candidate_answer and a.candidate_answer.strip() not in ["Not answered", "[Candidate skipped question without speaking]"]),
            "technical_score": a.relevance_score,
            "grammar_score": a.grammar_score,
            "feedback": a.feedback_notes
        }
        for a in answers
    ]

    return {
        "session_id": session.id,
        "title": session.title,
        "category": session.category,
        "difficulty": session.difficulty,
        "domain": session.domain,
        "status": session.status,
        "ended_reason": session.ended_reason,
        "started_at": session.started_at.isoformat() if session.started_at else datetime.utcnow().isoformat(),
        "overall_score": session.overall_score,
        "performance_rating": session.performance_rating,
        "candidate": {
            "id": session.user.id if session.user else current_user.id,
            "full_name": session.user.full_name if session.user else current_user.full_name,
            "email": session.user.email if session.user else current_user.email,
            "role": session.user.role if session.user else current_user.role
        },
        "questions": session.questions_data or [],
        "answers_history": answers_history
    }

@app.post("/api/llm/next-question")
def next_adaptive_question(
    payload: Dict[str, Any],
    db: Session = Depends(database.get_db)
):
    domain = payload.get("domain", "Python Developer")
    difficulty = payload.get("difficulty", "Medium")
    skills = payload.get("skills", [])
    previous_questions = payload.get("previous_questions", [])
    candidate_answer = payload.get("candidate_answer", "")

    question_obj = question_service.generate_adaptive_followup_question(
        domain=domain,
        difficulty=difficulty,
        skills=skills,
        previous_questions=previous_questions,
        candidate_answer=candidate_answer
    )

    return {"question": question_obj}

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
    # Verify active session
    session = db.query(models.InterviewSession).filter(models.InterviewSession.id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

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

    # Check for existing record to prevent duplicate question answers
    existing_qa = db.query(models.QuestionAnswer).filter(
        models.QuestionAnswer.session_id == req.session_id,
        models.QuestionAnswer.question_index == req.question_index
    ).first()

    if existing_qa:
        existing_qa.question_text = req.question_text
        existing_qa.candidate_answer = final_text
        existing_qa.transcript = final_text
        existing_qa.filler_words_detected = speech_metrics["detected_fillers"]
        existing_qa.grammar_score = speech_metrics["grammar_score"] if is_answered else 0.0
        existing_qa.relevance_score = tech_score
        existing_qa.eye_contact_percentage = vision_metrics["eye_contact_percentage"]
        existing_qa.feedback_notes = llm_eval.get("feedback", "Evaluation recorded.")
        qa_record = existing_qa
    else:
        qa_record = models.QuestionAnswer(
            session_id=req.session_id,
            question_index=req.question_index,
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
    reason: Optional[str] = Query("completed"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    session = db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    answers = db.query(models.QuestionAnswer).filter(models.QuestionAnswer.session_id == session_id).all()
    
    answered_list = [a for a in answers if a.candidate_answer and a.candidate_answer not in ["Not answered", "[Candidate skipped question without speaking]"]]
    unanswered_count = session.total_questions - len(answered_list)

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

    eval_result["session_id"] = session_id
    eval_result["answered_questions_count"] = len(answered_list)
    eval_result["unanswered_questions_count"] = max(0, unanswered_count)
    eval_result["total_questions_count"] = session.total_questions
    eval_result["category"] = session.category
    eval_result["difficulty"] = session.difficulty
    eval_result["domain"] = session.domain
    eval_result["status"] = reason or "completed"
    eval_result["ended_reason"] = reason or "completed"
    eval_result["candidate"] = {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role
    }

    eval_result["answers_history"] = [
        {
            "q_num": a.question_index,
            "q_text": a.question_text,
            "user_answer": a.candidate_answer,
            "is_answered": bool(a.candidate_answer and a.candidate_answer not in ["Not answered", "[Candidate skipped question without speaking]"]),
            "technical_score": a.relevance_score,
            "clarity_score": a.grammar_score,
            "feedback": a.feedback_notes
        }
        for a in answers
    ]

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
    session.status = reason or "completed"
    session.ended_reason = reason or "completed"
    session.finished_at = datetime.utcnow()

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

    completed = [s for s in sessions if s.status in ["completed", "ended_by_candidate"]]
    avg_score = round(sum(s.overall_score for s in completed) / len(completed), 1) if completed else 0.0

    recent_sessions = [
        {
            "id": s.id,
            "title": s.title,
            "category": s.category,
            "difficulty": s.difficulty,
            "overall_score": s.overall_score,
            "performance_rating": s.performance_rating,
            "status": s.status,
            "ended_reason": s.ended_reason,
            "created_at": s.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for s in reversed(sessions[-5:])
    ]

    return {
        "user_name": current_user.full_name,
        "user_email": current_user.email,
        "user_role": current_user.role,
        "total_interviews": len(sessions),
        "completed_interviews": len(completed),
        "average_overall_score": avg_score,
        "resumes_uploaded": len(resumes),
        "recent_sessions": recent_sessions,
        "skill_breakdown": [
            {"skill": "Technical Knowledge", "score": avg_score},
            {"skill": "Communication", "score": min(avg_score + 5.0, 100.0)},
            {"skill": "Confidence & Eye Contact", "score": min(avg_score + 2.0, 100.0)}
        ]
    }

@app.get("/api/recruiter/analytics")
def recruiter_analytics(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Recruiter access required")

    candidates = db.query(models.User).filter(models.User.role == "candidate").all()
    sessions = db.query(models.InterviewSession).all()

    completed = [s for s in sessions if s.status in ["completed", "ended_by_candidate"]]
    avg_platform_score = round(sum(s.overall_score for s in completed) / len(completed), 1) if completed else 0.0

    candidate_list = []
    for c in candidates:
        c_sessions = [s for s in sessions if s.user_id == c.id and s.status in ["completed", "ended_by_candidate"]]
        c_avg = round(sum(s.overall_score for s in c_sessions) / len(c_sessions), 1) if c_sessions else 0.0
        candidate_list.append({
            "id": c.id,
            "name": c.full_name,
            "email": c.email,
            "interviews_completed": len(c_sessions),
            "average_score": c_avg,
            "status": "Recommended" if c_avg >= 80 else ("Under Review" if c_avg >= 60 else "Screened")
        })

    return {
        "total_candidates": len(candidates),
        "average_platform_score": avg_platform_score,
        "candidates": candidate_list
    }

@app.get("/api/admin/metrics")
def admin_metrics(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    total_users = db.query(models.User).count()
    total_sessions = db.query(models.InterviewSession).count()
    total_resumes = db.query(models.Resume).count()

    return {
        "total_users": total_users,
        "total_sessions": total_sessions,
        "total_resumes_parsed": total_resumes,
        "system_status": "Operational",
        "ai_engine_version": "SmartHire v3.2 (Groq openai/gpt-oss-120b + Mira)"
    }
