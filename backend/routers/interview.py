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
from pymongo.database import Database
import pymongo
from bson import ObjectId
from pydantic import BaseModel

from backend.database import get_db
from backend.models.session import InterviewSession, InterviewQuestion, InterviewAnswer, SessionReport, IntegrityEvent
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
    question_id: str
    transcribed_text: str
    answer_duration: float = 60
    eye_contact_score: float = 0
    emotion_label: str = "neutral"

class EndSessionRequest(BaseModel):
    session_id: str

class AvatarClipRequest(BaseModel):
    text: str
    avatar_url: str = ""


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/start")
def start_session(
    req: StartSessionRequest,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new interview session.
    Fetches candidate skills from resume, generates AI questions.
    """
    import traceback
    try:
        # Get candidate's skills from their uploaded resume
        candidate_doc = db.candidates.find_one({"email": current_user.email})
        skills = []
        if candidate_doc and candidate_doc.get("resume_preview"):
            from backend.services.resume_parser import extract_skills
            skills = extract_skills(candidate_doc["resume_preview"])

        # Create session record
        session = InterviewSession(
            user_id        = current_user.id,
            interview_type = req.interview_type,
            domain         = req.domain,
            difficulty     = req.difficulty,
            status         = "active",
        )
        session_dict = session.model_dump(by_alias=True)
        if "_id" in session_dict and not session_dict["_id"]:
            del session_dict["_id"]
        result = db.interview_sessions.insert_one(session_dict)
        session.id = str(result.inserted_id)

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
            q_dict = question.model_dump(by_alias=True)
            if "_id" in q_dict and not q_dict["_id"]:
                del q_dict["_id"]
            q_res = db.interview_questions.insert_one(q_dict)
            question.id = str(q_res.inserted_id)
            saved_questions.append(question)

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
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}/questions")
def get_questions(
    session_id: str,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all questions for a session."""
    session_doc = db.interview_sessions.find_one({"_id": ObjectId(session_id)})
    if not session_doc or session_doc.get("user_id") != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session = InterviewSession.from_mongo(session_doc)
    
    # Time gating logic
    if session.scheduled_start:
        now = datetime.utcnow()
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
                db.interview_sessions.update_one({"_id": ObjectId(session_id)}, {"$set": {"status": "expired"}})
            return {"state": "EXPIRED"}
            
    if session.status in ["completed", "expired", "no_show"]:
        return {"state": "SESSION_ENDED"}

    q_docs = list(db.interview_questions.find({"session_id": session_id}).sort("question_number", pymongo.ASCENDING))
    questions = [InterviewQuestion.from_mongo(d) for d in q_docs]
    
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
    session_id: str,
    req: IntegrityEventRequest,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session_doc = db.interview_sessions.find_one({"_id": ObjectId(session_id)})
    if not session_doc or session_doc.get("user_id") != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
        
    event = IntegrityEvent(
        session_id=session_id,
        event_type=req.event_type,
        duration_seconds=req.duration_seconds,
        description=req.description,
        severity=req.severity
    )
    e_dict = event.model_dump(by_alias=True)
    if "_id" in e_dict and not e_dict["_id"]:
        del e_dict["_id"]
    db.integrity_events.insert_one(e_dict)
    return {"status": "ok"}


@router.post("/{session_id}/accept-rules")
def accept_rules(
    session_id: str,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session_doc = db.interview_sessions.find_one({"_id": ObjectId(session_id)})
    if not session_doc or session_doc.get("user_id") != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
        
    accepted_time = datetime.utcnow()
    db.interview_sessions.update_one(
        {"_id": ObjectId(session_id)}, 
        {"$set": {"rules_accepted_at": accepted_time}}
    )
    return {"status": "ok", "rules_accepted_at": accepted_time.isoformat()}


# ── Admin Integrity Endpoints ──

@router.get("/admin/integrity-sessions")
def get_admin_integrity_sessions(db: Database = Depends(get_db)):
    """Return all sessions with integrity event counts."""
    session_docs = list(db.interview_sessions.find().sort("started_at", pymongo.DESCENDING))
    results = []
    
    for s_doc in session_docs:
        s_id = str(s_doc["_id"])
        
        flags_count = db.integrity_events.count_documents({"session_id": s_id})
        high_severity = db.integrity_events.count_documents({"session_id": s_id, "severity": "high"})
        
        status = "Clean"
        if flags_count > 0:
            status = "Flagged"
        if high_severity > 1 or flags_count > 3:
            status = "High Risk"
            
        results.append({
            "id": s_id,
            "user_id": s_doc.get("user_id"),
            "started_at": s_doc.get("started_at").isoformat() if s_doc.get("started_at") else None,
            "interview_type": s_doc.get("interview_type"),
            "status": s_doc.get("status"),
            "flags_count": flags_count,
            "integrity_status": status
        })
    return results


@router.get("/admin/integrity-events/{session_id}")
def get_admin_integrity_events(session_id: str, db: Database = Depends(get_db)):
    """Return all integrity events for a specific session."""
    events = list(db.integrity_events.find({"session_id": session_id}).sort("timestamp", pymongo.ASCENDING))
    return [IntegrityEvent.from_mongo(e).to_dict() for e in events]


class ScheduleRequest(BaseModel):
    candidate_id: str
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
    db: Database = Depends(get_db),
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
        scheduled_start=req.scheduled_start.replace(tzinfo=None), 
        duration_minutes=req.duration_minutes
    )
    s_dict = session.model_dump(by_alias=True)
    if "_id" in s_dict and not s_dict["_id"]:
        del s_dict["_id"]
    res = db.interview_sessions.insert_one(s_dict)
    session.id = str(res.inserted_id)
    return session.to_dict()


@router.post("/{session_id}/answer")
def submit_answer(
    session_id: str,
    req: SubmitAnswerRequest,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit candidate's transcribed answer for one question.
    Runs AI evaluation and saves scores.
    """
    q_doc = db.interview_questions.find_one({"_id": ObjectId(req.question_id)})
    if not q_doc:
        raise HTTPException(status_code=404, detail="Question not found")
    question = InterviewQuestion.from_mongo(q_doc)

    keywords = [k.strip() for k in (question.expected_keywords or "").split(",") if k.strip()]

    evaluation = evaluate_answer(
        question_text     = question.question_text,
        answer_text       = req.transcribed_text,
        expected_keywords = keywords,
        interview_type    = question.question_type,
        duration_seconds  = req.answer_duration,
    )

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
    a_dict = answer.model_dump(by_alias=True)
    if "_id" in a_dict and not a_dict["_id"]:
        del a_dict["_id"]
    db.interview_answers.insert_one(a_dict)

    return answer.to_dict()


@router.post("/end")
def end_session(
    req: EndSessionRequest,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    End interview session.
    Aggregates all answer scores → final weighted report → saves to DB.
    Also exports this session to ML training data.
    """
    session_doc = db.interview_sessions.find_one({"_id": ObjectId(req.session_id)})
    if not session_doc:
        raise HTTPException(status_code=404, detail="Session not found")
    session = InterviewSession.from_mongo(session_doc)

    a_docs = list(db.interview_answers.find({"session_id": req.session_id}))
    answers = [InterviewAnswer.from_mongo(a).to_dict() for a in a_docs]

    agg = aggregate_answers(answers)

    overall = calculate_overall_score(
        communication   = agg["communication"],
        confidence      = agg["confidence"],
        technical       = agg["technical"],
        professionalism = agg["professionalism"],
    )

    ended_at = datetime.utcnow()
    duration_min = (ended_at - session.started_at).total_seconds() / 60
    db.interview_sessions.update_one(
        {"_id": ObjectId(req.session_id)},
        {"$set": {"ended_at": ended_at, "status": "completed"}}
    )

    feedback = generate_text_feedback(agg, session.interview_type, session.domain, overall)

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
    r_dict = report.model_dump(by_alias=True)
    if "_id" in r_dict and not r_dict["_id"]:
        del r_dict["_id"]
    db.session_reports.insert_one(r_dict)

    try:
        collect_from_session(session.id)
    except Exception as e:
        print(f"[ML] Training data collection error: {e}")

    return report.to_dict()


@router.get("/{session_id}/report")
def get_report(
    session_id: str,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return final report for a completed session."""
    r_doc = db.session_reports.find_one({"session_id": session_id})
    if not r_doc:
        raise HTTPException(status_code=404, detail="Report not found — session may not be completed yet")
    return SessionReport.from_mongo(r_doc).to_dict()


@router.get("/history")
def get_history(db: Database = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return all past sessions for a candidate."""
    s_docs = list(db.interview_sessions.find({"user_id": current_user.id}).sort("started_at", pymongo.DESCENDING))
    return [InterviewSession.from_mongo(s).to_dict() for s in s_docs]


@router.get("/candidate/scheduled")
def get_scheduled_sessions(db: Database = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return all upcoming scheduled sessions for a candidate."""
    s_docs = list(db.interview_sessions.find({
        "user_id": current_user.id, 
        "status": "scheduled"
    }).sort("scheduled_start", pymongo.ASCENDING))
    return [InterviewSession.from_mongo(s).to_dict() for s in s_docs]


# ── Priority 1 New Endpoints ──────────────────────────────────────────────────
from fastapi.responses import StreamingResponse
from fastapi import UploadFile, File
import io
import os

@router.get("/tts")
async def get_tts(text: str):
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
    session_id: str,
    file: UploadFile = File(...),
):
    audio_bytes = await file.read()
    from backend.services.speech_service import transcribe_audio
    transcript = await transcribe_audio(audio_bytes, filename=file.filename)
    return {"transcript": transcript}


class FollowUpRequest(BaseModel):
    question_text: str
    answer_text: str

@router.post("/{session_id}/follow-up")
async def get_follow_up(session_id: str, req: FollowUpRequest):
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
    from backend.services.avatar_service import generate_avatar_video
    url = await generate_avatar_video(req.text, req.avatar_url)
    return {"video_url": url}
