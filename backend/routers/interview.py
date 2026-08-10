"""
routers/interview.py — Interview session lifecycle

POST /interview/start          — create session, generate questions
GET  /interview/{id}/questions — get questions for a session
POST /interview/{id}/answer    — submit one answer (text + scores from frontend)
POST /interview/{id}/end       — end session, compute final report
GET  /interview/{id}/report    — retrieve final report
GET  /interview/history        — list all sessions for current user
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel

from backend.database import get_db
from backend.models.session import InterviewSession, InterviewQuestion, InterviewAnswer, SessionReport
from backend.models.candidate import Candidate
from backend.routers.auth import get_current_user
from backend.models.user import User
from backend.services.question_generator import generate_questions
from backend.services.answer_evaluator import evaluate_answer
from backend.services.scoring_engine import (
    calculate_overall_score, get_rating, aggregate_answers, generate_text_feedback
)
from backend.ml.data_collector import collect_from_session

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    interview_type: str = "Technical"
    domain: str         = "Web development"
    difficulty: str     = "Medium"
    num_questions: int  = 8

class SubmitAnswerRequest(BaseModel):
    question_id: int
    transcribed_text: str
    answer_duration: float = 60
    eye_contact_score: float = 0
    emotion_label: str = "neutral"

class EndSessionRequest(BaseModel):
    session_id: int

class AvatarClipRequest(BaseModel):
    text: str
    avatar_url: str = ""


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/start")
def start_session(
    req: StartSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new interview session.
    Fetches candidate skills from resume, generates AI questions.
    """
    import traceback
    try:
        # Get candidate's skills from their uploaded resume
        candidate = db.scalar(select(Candidate).where(Candidate.email == current_user.email))
        skills = []
        if candidate and candidate.resume_preview:
            from backend.services.resume_parser import extract_skills
            skills = extract_skills(candidate.resume_preview)

        # Create session record
        session = InterviewSession(
            user_id        = current_user.id,
            interview_type = req.interview_type,
            domain         = req.domain,
            difficulty     = req.difficulty,
            status         = "active",
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        # Generate questions using OpenAI (or fallback)
        raw_questions = generate_questions(
            skills         = skills,
            interview_type = req.interview_type,
            domain         = req.domain,
            difficulty     = req.difficulty,
            num_questions  = req.num_questions,
        )

        # Save questions to DB
        saved_questions = []
        for q in raw_questions:
            question = InterviewQuestion(
                session_id        = session.id,
                question_number   = q["question_number"],
                question_text     = q["question_text"],
                expected_keywords = ",".join(q.get("expected_keywords", [])),
                question_type     = q.get("question_type", req.interview_type),
            )
            db.add(question)
            saved_questions.append(question)

        db.commit()

        return {
            "session_id":   session.id,
            "interview_type": session.interview_type,
            "domain":        session.domain,
            "difficulty":    session.difficulty,
            "questions": [
                {"id": q.id, "question_number": q.question_number, "question_text": q.question_text}
                for q in saved_questions
            ],
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/questions")
def get_questions(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all questions for a session."""
    session = db.scalar(select(InterviewSession).where(InterviewSession.id == session_id))
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Time gating logic
    if session.scheduled_start:
        now = datetime.utcnow()
        # Window: 10 mins before to (duration + 5) mins after
        start_window = session.scheduled_start - timedelta(minutes=10)
        end_window = session.scheduled_start + timedelta(minutes=session.duration_minutes + 5)
        
        if now < start_window:
            return {
                "state": "TOO_EARLY",
                "scheduled_start": session.scheduled_start.isoformat(),
                "duration_minutes": session.duration_minutes
            }
            
        if now > end_window:
            if session.status == "scheduled":
                session.status = "expired"
                db.commit()
            return {"state": "EXPIRED"}
            
    if session.status in ["completed", "expired", "no_show"]:
        return {"state": "SESSION_ENDED"}

    questions = db.scalars(
        select(InterviewQuestion).where(InterviewQuestion.session_id == session_id)
        .order_by(InterviewQuestion.question_number)
    ).all()
    
    return {
        "state": "READY",
        "rules_accepted": session.rules_accepted_at is not None,
        "scheduled_start": session.scheduled_start.isoformat() if session.scheduled_start else None,
        "duration_minutes": session.duration_minutes,
        "questions": [q.to_dict() for q in questions]
    }


class IntegrityEventRequest(BaseModel):
    event_type: str
    duration_seconds: float
    description: str = ""
    severity: str = "medium"

@router.post("/{session_id}/integrity-events")
def log_integrity_event(
    session_id: int,
    req: IntegrityEventRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from backend.models.session import IntegrityEvent
    session = db.scalar(select(InterviewSession).where(InterviewSession.id == session_id))
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
        
    event = IntegrityEvent(
        session_id=session_id,
        event_type=req.event_type,
        duration_seconds=req.duration_seconds,
        description=req.description,
        severity=req.severity
    )
    db.add(event)
    db.commit()
    return {"status": "ok"}


@router.post("/{session_id}/accept-rules")
def accept_rules(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.scalar(select(InterviewSession).where(InterviewSession.id == session_id))
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session.rules_accepted_at = datetime.utcnow()
    db.commit()
    return {"status": "ok", "rules_accepted_at": session.rules_accepted_at.isoformat()}


# ── Admin Integrity Endpoints ──

@router.get("/admin/integrity-sessions")
def get_admin_integrity_sessions(db: Session = Depends(get_db)):
    """Return all sessions with integrity event counts."""
    from sqlalchemy import func
    from backend.models.session import IntegrityEvent
    
    sessions = db.scalars(select(InterviewSession).order_by(InterviewSession.started_at.desc())).all()
    results = []
    
    # Simple N+1 queries for this scale, or group by. Let's do simple for now.
    for s in sessions:
        # Count flags
        flags_count = db.scalar(select(func.count(IntegrityEvent.id)).where(IntegrityEvent.session_id == s.id))
        high_severity = db.scalar(select(func.count(IntegrityEvent.id)).where(IntegrityEvent.session_id == s.id, IntegrityEvent.severity == "high"))
        
        status = "Clean"
        if flags_count > 0:
            status = "Flagged"
        if high_severity > 1 or flags_count > 3:
            status = "High Risk"
            
        results.append({
            "id": s.id,
            "user_id": s.user_id,
            "started_at": s.started_at.isoformat(),
            "interview_type": s.interview_type,
            "status": s.status,
            "flags_count": flags_count or 0,
            "integrity_status": status
        })
    return results


@router.get("/admin/integrity-events/{session_id}")
def get_admin_integrity_events(session_id: int, db: Session = Depends(get_db)):
    """Return all integrity events for a specific session."""
    from backend.models.session import IntegrityEvent
    events = db.scalars(
        select(IntegrityEvent)
        .where(IntegrityEvent.session_id == session_id)
        .order_by(IntegrityEvent.timestamp.asc())
    ).all()
    return [e.to_dict() for e in events]


class ScheduleRequest(BaseModel):
    candidate_id: int
    company_name: str
    job_title: str
    scheduled_start: datetime
    duration_minutes: int
    interview_type: str = "Technical"
    domain: str = "General"
    difficulty: str = "Medium"

@router.post("/admin/schedule")
def schedule_interview(
    req: ScheduleRequest,
    db: Session = Depends(get_db),
    # In a real app, verify admin here: current_user: User = Depends(get_current_user)
):
    """Admin endpoint to create a scheduled session."""
    session = InterviewSession(
        user_id=req.candidate_id,
        interview_type=req.interview_type,
        domain=req.domain,
        difficulty=req.difficulty,
        status="scheduled",
        company_name=req.company_name,
        job_title=req.job_title,
        scheduled_start=req.scheduled_start.replace(tzinfo=None), # Store as UTC naive
        duration_minutes=req.duration_minutes
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session.to_dict()


@router.post("/{session_id}/answer")
def submit_answer(
    session_id: int,
    req: SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit candidate's transcribed answer for one question.
    Runs AI evaluation and saves scores.
    """
    question = db.scalar(select(InterviewQuestion).where(InterviewQuestion.id == req.question_id))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Get expected keywords
    keywords = [k.strip() for k in (question.expected_keywords or "").split(",") if k.strip()]

    # Evaluate using AI + local analysis
    evaluation = evaluate_answer(
        question_text     = question.question_text,
        answer_text       = req.transcribed_text,
        expected_keywords = keywords,
        interview_type    = question.question_type,
        duration_seconds  = req.answer_duration,
    )

    # Save answer with scores
    answer = InterviewAnswer(
        question_id           = req.question_id,
        session_id            = session_id,
        transcribed_text      = req.transcribed_text,
        answer_duration       = req.answer_duration,
        communication_score   = evaluation["communication_score"],
        technical_score       = evaluation["technical_score"],
        confidence_score      = evaluation["confidence_score"],
        professionalism_score = evaluation["professionalism_score"],
        filler_word_count     = evaluation["filler_word_count"],
        words_per_minute      = evaluation["words_per_minute"],
        ai_feedback           = evaluation.get("feedback", ""),
        eye_contact_score     = req.eye_contact_score,
        emotion_label         = req.emotion_label,
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)

    return answer.to_dict()


@router.post("/end")
def end_session(
    req: EndSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    End interview session.
    Aggregates all answer scores → final weighted report → saves to DB.
    Also exports this session to ML training data.
    """
    session = db.scalar(select(InterviewSession).where(InterviewSession.id == req.session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get all answers
    answers_orm = db.scalars(
        select(InterviewAnswer).where(InterviewAnswer.session_id == req.session_id)
    ).all()
    answers = [a.to_dict() for a in answers_orm]

    # Aggregate scores
    agg = aggregate_answers(answers)

    # Weighted overall score
    overall = calculate_overall_score(
        communication   = agg["communication"],
        confidence      = agg["confidence"],
        technical       = agg["technical"],
        professionalism = agg["professionalism"],
    )

    # Duration
    session.ended_at = datetime.utcnow()
    session.status   = "completed"
    duration_min = (session.ended_at - session.started_at).total_seconds() / 60

    # AI feedback text
    feedback = generate_text_feedback(agg, session.interview_type, session.domain, overall)

    # Save report
    report = SessionReport(
        session_id            = session.id,
        user_id               = current_user.id,
        overall_score         = overall,
        communication_score   = agg["communication"],
        confidence_score      = agg["confidence"],
        technical_score       = agg["technical"],
        professionalism_score = agg["professionalism"],
        rating                = get_rating(overall),
        strengths             = feedback.get("strengths", ""),
        weaknesses            = feedback.get("weaknesses", ""),
        suggestions           = feedback.get("suggestions", ""),
        total_questions       = len(answers),
        avg_filler_words      = agg["avg_filler_words"],
        avg_words_per_min     = agg["avg_wpm"],
        avg_eye_contact       = agg["avg_eye_contact"],
        duration_minutes      = round(duration_min, 1),
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Save to ML training data (async-safe — runs in background)
    try:
        collect_from_session(session.id)
    except Exception as e:
        print(f"[ML] Training data collection error: {e}")

    return report.to_dict()


@router.get("/{session_id}/report")
def get_report(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return final report for a completed session."""
    report = db.scalar(select(SessionReport).where(SessionReport.session_id == session_id))
    if not report:
        raise HTTPException(status_code=404, detail="Report not found — session may not be completed yet")
    return report.to_dict()


@router.get("/history")
def get_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return all past sessions for a candidate."""
    sessions = db.scalars(
        select(InterviewSession)
        .where(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.started_at.desc())
    ).all()
    return [s.to_dict() for s in sessions]


@router.get("/candidate/scheduled")
def get_scheduled_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return all upcoming scheduled sessions for a candidate."""
    sessions = db.scalars(
        select(InterviewSession)
        .where(InterviewSession.user_id == current_user.id, InterviewSession.status == "scheduled")
        .order_by(InterviewSession.scheduled_start.asc())
    ).all()
    return [s.to_dict() for s in sessions]


# ── Priority 1 New Endpoints ──────────────────────────────────────────────────
from fastapi.responses import StreamingResponse
from fastapi import UploadFile, File
import io
import os

@router.get("/tts")
async def get_tts(text: str):
    """
    Generate speech using OpenAI TTS.
    """
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key or api_key.startswith("sk-your"):
        raise HTTPException(status_code=400, detail="OpenAI API key not configured")
    
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=api_key)
        response = await client.audio.speech.create(
            model="tts-1",
            voice="nova",
            input=text
        )
        return StreamingResponse(io.BytesIO(response.content), media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")


@router.post("/{session_id}/whisper")
async def upload_whisper(
    session_id: int,
    file: UploadFile = File(...),
):
    """
    Upload recorded audio for Whisper transcription.
    """
    audio_bytes = await file.read()
    from backend.services.speech_service import transcribe_audio
    transcript = await transcribe_audio(audio_bytes, filename=file.filename)
    return {"transcript": transcript}


class FollowUpRequest(BaseModel):
    question_text: str
    answer_text: str

@router.post("/{session_id}/follow-up")
async def get_follow_up(session_id: int, req: FollowUpRequest):
    """
    Check if the answer is complete and specific. If not, generate a follow-up question.
    """
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key or api_key.startswith("sk-your"):
        return {"follow_up": None}
    
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=api_key)
        prompt = f"""
Original Interview Question: {req.question_text}
Candidate's Answer: {req.answer_text}

Is this answer complete and specific? If the answer is vague, incomplete, or lacks detail, generate a one-sentence follow-up question that asks for clarification or details.
If the answer is complete, detailed, and specific, return null.
Return ONLY the one-sentence follow-up question or the word 'null' (without quotes, lowercase).
"""
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful and precise interview interviewer."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=100
        )
        content = response.choices[0].message.content.strip()
        if content.lower() == "null" or not content:
            return {"follow_up": None}
        return {"follow_up": content}
    except Exception as e:
        print(f"Follow-up generation failed: {e}")
        return {"follow_up": None}


@router.post("/generate-avatar-clip")
async def generate_avatar_clip(req: AvatarClipRequest):
    """
    Generate a D-ID talking avatar video for the given text.
    Returns { "video_url": "..." } or None if failed.
    """
    from backend.services.avatar_service import generate_avatar_video
    url = await generate_avatar_video(req.text, req.avatar_url)
    return {"video_url": url}


