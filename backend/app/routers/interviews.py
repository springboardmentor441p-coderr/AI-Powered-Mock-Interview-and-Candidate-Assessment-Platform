from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import io
from pypdf import PdfReader
from ..database import get_db
from .. import models, schemas, auth
from ..services.ai_service import AIService
from ..services.analysis_service import AnalysisService

router = APIRouter(prefix="/api/interviews", tags=["interviews"])

# --- Candidate Routes ---

@router.post("/session", response_model=schemas.InterviewSessionDetail)
async def create_session(
    request: Request,
    domain: str = Form(...),
    difficulty: str = Form(...),
    template_id: Optional[int] = Form(None),
    resume_file: Optional[UploadFile] = File(None),
    jd_file: Optional[UploadFile] = File(None),
    jd_text: Optional[str] = Form(None),
    current_user: models.User = Depends(auth.check_role(["candidate"])),
    db: Session = Depends(get_db)
):
    """
    Starts a new interview session. Generates 5 questions.
    """
    # 1. Parse Resume if provided
    resume_text = None
    if resume_file:
        try:
            contents = await resume_file.read()
            pdf_file = io.BytesIO(contents)
            reader = PdfReader(pdf_file)
            resume_text = ""
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    resume_text += text + "\n"
        except Exception as e:
            print(f"Error parsing resume PDF: {e}")
            
    # Fallback to candidate profile if no resume uploaded in session
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    skills = profile.parsed_skills if profile and profile.parsed_skills else []
    if not resume_text and profile:
        # Reconstruct simple resume text from profile details
        resume_text = profile.summary or ""
        if profile.parsed_skills:
            resume_text += f"\nSkills: {', '.join(profile.parsed_skills)}"

    # 2. Parse Job Description if provided
    extracted_jd = jd_text or ""
    if jd_file:
        try:
            contents = await jd_file.read()
            if jd_file.filename.endswith(".pdf"):
                pdf_file = io.BytesIO(contents)
                reader = PdfReader(pdf_file)
                jd_pdf_text = ""
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        jd_pdf_text += text + "\n"
                extracted_jd = jd_pdf_text
            else:
                extracted_jd = contents.decode("utf-8", errors="ignore")
        except Exception as e:
            print(f"Error parsing JD file: {e}")

    # Enforce compulsory Resume and Job Description for all interviews
    if not resume_text or not resume_text.strip():
        raise HTTPException(
            status_code=400, 
            detail="Candidate Resume is required to create a dynamic interview session. Please upload a resume PDF or update your profile."
        )
    if not extracted_jd or not extracted_jd.strip():
        raise HTTPException(
            status_code=400, 
            detail="Job Description (JD) is required to create a dynamic interview session. Please provide a JD document or text."
        )

    questions_list = []
    template = None
    
    if template_id:
        template = db.query(models.InterviewTemplate).filter(models.InterviewTemplate.id == template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        domain = template.domain
        difficulty = template.difficulty

    # Get optional API keys from headers
    api_keys = {
        "gemini_api_key": request.headers.get("x-gemini-key"),
        "openai_api_key": request.headers.get("x-openai-key")
    }
    
    # Always call AI question generator for dynamic personalized questions based on Resume + JD
    full_qs = AIService.generate_questions(
        domain=domain,
        difficulty=difficulty,
        parsed_skills=skills,
        resume_text=resume_text,
        job_description=extracted_jd,
        candidate_name=current_user.full_name,
        api_keys=api_keys
    )
    questions_list = [full_qs[0]] if full_qs else [{"text": "Can you introduce yourself and outline how your background matches the Job Description requirements?", "category": "hr"}]

    # 3. Create Interview Session
    session = models.InterviewSession(
        candidate_id=current_user.id,
        template_id=template.id if template else None,
        domain=domain,
        difficulty=difficulty,
        status="in_progress",
        resume_text=resume_text,
        job_description=extracted_jd if extracted_jd else None
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # 4. Create Interview Questions
    db_questions = []
    for idx, q in enumerate(questions_list):
        db_q = models.InterviewQuestion(
            session_id=session.id,
            question_text=q["text"],
            category=q.get("category", "technical"),
            order=idx + 1
        )
        db.add(db_q)
        db_questions.append(db_q)
        
    db.commit()
    
    # Reload session details
    session_detail = db.query(models.InterviewSession).filter(models.InterviewSession.id == session.id).first()
    return session_detail


@router.post("/session/{session_id}/answer", response_model=schemas.InterviewAnswerResponse)
def submit_answer(
    session_id: int,
    answer_in: schemas.InterviewAnswerCreate,
    request: Request,
    current_user: models.User = Depends(auth.check_role(["candidate"])),
    db: Session = Depends(get_db)
):
    """
    Submits a candidate's answer transcript, processes speech-analysis heuristics and semantic scoring.
    """
    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == session_id,
        models.InterviewSession.candidate_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
        
    if session.status != "in_progress":
        raise HTTPException(status_code=400, detail="This interview session is not in progress")

    question = db.query(models.InterviewQuestion).filter(
        models.InterviewQuestion.id == answer_in.question_id,
        models.InterviewQuestion.session_id == session_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found in this session")

    # Get optional API keys from headers
    api_keys = {
        "gemini_api_key": request.headers.get("x-gemini-key"),
        "openai_api_key": request.headers.get("x-openai-key")
    }

    # 1. Run heuristic script calculations
    metrics = AnalysisService.analyze_answer(
        question_text=question.question_text,
        answer_text=answer_in.answer_text,
        duration_seconds=answer_in.duration_seconds,
        eye_contact_pct=answer_in.eye_contact_pct,
        domain=session.domain
    )

    # 2. Run semantic AI scoring
    ai_evaluation = AIService.evaluate_answer(
        question=question.question_text,
        answer=answer_in.answer_text,
        api_keys=api_keys
    )

    # Make sure we combine scores. If AI scored, we use it for technical rating
    score = ai_evaluation.get("score", metrics["technical_score"])
    feedback_text = ai_evaluation.get("feedback_text", "Answer recorded successfully.")

    # 3. Save Answer Entry
    db_answer = models.InterviewAnswer(
        session_id=session_id,
        question_id=answer_in.question_id,
        answer_text=answer_in.answer_text,
        duration_seconds=answer_in.duration_seconds,
        filler_word_count=metrics["filler_word_count"],
        wpm=metrics["wpm"],
        confidence_pct=metrics["confidence_score"],
        eye_contact_pct=answer_in.eye_contact_pct,
        transcript_confidence=answer_in.transcript_confidence,
        score=score,
        feedback_text=feedback_text
    )
    
    db.add(db_answer)
    db.commit()
    db.refresh(db_answer)

    # 4. Conversational Flow: Check if we need to generate follow-up questions
    # Limit: 8 questions (fits a 10-minute session perfectly)
    if not session.template_id:
        completed_answers = db.query(models.InterviewAnswer).filter(
            models.InterviewAnswer.session_id == session_id
        ).order_by(models.InterviewAnswer.id.asc()).all()
        
        num_completed = len(completed_answers)
        if num_completed < 8:
            # Gather conversation history so far with score & feedback context
            history = []
            for ans in completed_answers[:-1]:
                q_desc = db.query(models.InterviewQuestion).filter(models.InterviewQuestion.id == ans.question_id).first()
                history.append({
                    "question": q_desc.question_text, 
                    "answer": ans.answer_text,
                    "score": ans.score,
                    "feedback": ans.feedback_text,
                    "category": q_desc.category
                })
            
            # Add the current answer to the history
            history.append({
                "question": question.question_text, 
                "answer": answer_in.answer_text,
                "score": score,
                "feedback": feedback_text,
                "category": question.category
            })
            
            # Generate next question dynamically holding context and checking answer quality
            next_q = AIService.generate_next_question(
                domain=session.domain,
                difficulty=session.difficulty,
                history=history,
                resume_text=session.resume_text,
                job_description=session.job_description,
                candidate_name=current_user.full_name,
                api_keys=api_keys
            )
            
            # Save next question
            db_next_q = models.InterviewQuestion(
                session_id=session_id,
                question_text=next_q["text"],
                category=next_q.get("category", "technical"),
                order=num_completed + 1
            )
            db.add(db_next_q)
            db.commit()

    return db_answer

@router.post("/session/{session_id}/question/{question_id}/audio")
async def upload_answer_audio(
    session_id: int,
    question_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.check_role(["candidate"])),
    db: Session = Depends(get_db)
):
    """
    Saves candidate microphone response audio webm blob to local storage uploads.
    """
    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == session_id,
        models.InterviewSession.candidate_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
        
    answer = db.query(models.InterviewAnswer).filter(
        models.InterviewAnswer.session_id == session_id,
        models.InterviewAnswer.question_id == question_id
    ).first()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer record not found. Submit the text answer first.")
        
    upload_path = os.path.join("uploads", "answers")
    os.makedirs(upload_path, exist_ok=True)
    
    file_location = os.path.join(upload_path, f"{session_id}_{question_id}.webm")
    with open(file_location, "wb") as f:
        f.write(await file.read())
        
    answer.audio_path = f"/uploads/answers/{session_id}_{question_id}.webm"
    db.commit()
    db.refresh(answer)
    
    return {"status": "success", "audio_path": answer.audio_path}


@router.post("/session/{session_id}/complete", response_model=schemas.InterviewSessionDetail)
def complete_session(
    session_id: int,
    request: Request,
    current_user: models.User = Depends(auth.check_role(["candidate"])),
    db: Session = Depends(get_db)
):
    """
    Finalizes the interview, aggregates sub-scores, and generates global AI recommendations.
    """
    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == session_id,
        models.InterviewSession.candidate_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
        
    answers = db.query(models.InterviewAnswer).filter(models.InterviewAnswer.session_id == session_id).all()
    if not answers:
        raise HTTPException(status_code=400, detail="Cannot complete an interview session with no answers")

    # 1. Aggregate heuristic scores
    answer_dicts = []
    qa_list = []
    for a in answers:
        # Re-run or query metrics
        question = db.query(models.InterviewQuestion).filter(models.InterviewQuestion.id == a.question_id).first()
        
        # Extract individual metric sub-scores stored in DB or recalculate
        metrics = AnalysisService.analyze_answer(
            question_text=question.question_text,
            answer_text=a.answer_text,
            duration_seconds=a.duration_seconds,
            eye_contact_pct=a.eye_contact_pct,
            domain=session.domain
        )
        # Use database score as technical score
        metrics["technical_score"] = a.score or metrics["technical_score"]
        answer_dicts.append(metrics)
        
        qa_list.append({
            "question": question.question_text,
            "answer": a.answer_text,
            "score": a.score
        })

    overall = AnalysisService.calculate_overall_scores(answer_dicts)

    # 2. Get optional API keys from headers for final coaching feedback
    api_keys = {
        "gemini_api_key": request.headers.get("x-gemini-key"),
        "openai_api_key": request.headers.get("x-openai-key")
    }
    
    # 3. Generate summary AI advice
    feedback_report = AIService.generate_session_feedback(qa_list, api_keys)

    # 4. Save results to Session
    session.status = "completed"
    session.total_score = overall["total_score"]
    session.communication_score = overall["communication_score"]
    session.confidence_score = overall["confidence_score"]
    session.technical_score = overall["technical_score"]
    session.professionalism_score = overall["professionalism_score"]
    session.feedback = feedback_report

    db.commit()
    db.refresh(session)
    return session


@router.get("/session/{session_id}", response_model=schemas.InterviewSessionDetail)
def get_session_detail(
    session_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed breakdown of a specific interview session.
    """
    session = db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
        
    # Check permissions (Candidate can only view their own, recruiters and admins can view any)
    if current_user.role == "candidate" and session.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to view this report")
        
    return session


@router.get("/analytics", response_model=dict)
def get_candidate_analytics(
    current_user: models.User = Depends(auth.check_role(["candidate"])),
    db: Session = Depends(get_db)
):
    """
    Retrieves history and average aggregates for the Candidate dashboard.
    """
    sessions = db.query(models.InterviewSession).filter(
        models.InterviewSession.candidate_id == current_user.id,
        models.InterviewSession.status == "completed"
    ).order_by(models.InterviewSession.created_at.asc()).all()

    if not sessions:
        return {
            "average_overall": 0,
            "average_communication": 0,
            "average_confidence": 0,
            "average_technical": 0,
            "average_professionalism": 0,
            "recent_interviews": [],
            "trends": []
        }

    total_sessions = len(sessions)
    avg_overall = sum(s.total_score for s in sessions) / total_sessions
    avg_comm = sum(s.communication_score for s in sessions) / total_sessions
    avg_conf = sum(s.confidence_score for s in sessions) / total_sessions
    avg_tech = sum(s.technical_score for s in sessions) / total_sessions
    avg_prof = sum(s.professionalism_score for s in sessions) / total_sessions

    # History summary
    recent_list = []
    trends = []
    for s in sessions:
        recent_list.append({
            "id": s.id,
            "domain": s.domain,
            "difficulty": s.difficulty,
            "score": s.total_score,
            "date": s.created_at.strftime("%Y-%m-%d")
        })
        trends.append({
            "date": s.created_at.strftime("%m/%d"),
            "Overall": s.total_score,
            "Communication": s.communication_score,
            "Confidence": s.confidence_score,
            "Technical": s.technical_score,
            "Professionalism": s.professionalism_score
        })

    # Return newest first in list, oldest first in trends
    recent_list.reverse()

    return {
        "average_overall": round(avg_overall, 1),
        "average_communication": round(avg_comm, 1),
        "average_confidence": round(avg_conf, 1),
        "average_technical": round(avg_tech, 1),
        "average_professionalism": round(avg_prof, 1),
        "recent_interviews": recent_list[:5],
        "trends": trends
    }

# --- Recruiter & Admin Routes ---

@router.get("/templates", response_model=List[schemas.InterviewTemplateResponse])
def get_templates(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all pre-set recruiter interview templates.
    """
    return db.query(models.InterviewTemplate).all()


@router.post("/templates", response_model=schemas.InterviewTemplateResponse)
def create_template(
    template_in: schemas.InterviewTemplateCreate,
    current_user: models.User = Depends(auth.check_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Allows recruiter or admin to create new custom mock interview templates.
    """
    template = models.InterviewTemplate(
        title=template_in.title,
        description=template_in.description,
        domain=template_in.domain,
        difficulty=template_in.difficulty,
        questions=template_in.questions,
        created_by_id=current_user.id
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/candidate/{candidate_id}/sessions", response_model=List[schemas.InterviewSessionResponse])
def get_candidate_sessions(
    candidate_id: int,
    current_user: models.User = Depends(auth.check_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Allows a recruiter to fetch all mock sessions completed by a specific candidate.
    """
    return db.query(models.InterviewSession).filter(
        models.InterviewSession.candidate_id == candidate_id,
        models.InterviewSession.status == "completed"
    ).order_by(models.InterviewSession.created_at.desc()).all()
