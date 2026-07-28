from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import os
import datetime
import requests
from app.database import get_db
from app.models.models import InterviewSession, InterviewQuestion, InterviewAnswer, Transcript, Score, Report
from app.schemas.schemas import CreateInterviewRequest, SaveInterviewRequest
from app.services.ai_service import AIService
from app.config import settings

router = APIRouter(prefix="/interview", tags=["AI Mock Interview Engine"])

@router.post("/setup")
def setup_interview(req: CreateInterviewRequest, db: Session = Depends(get_db)):
    resume_info = AIService.extract_resume_info("Technical Resume text with Python, React, SQL, Node.js, REST API")
    jd_info = AIService.extract_jd_info("Software Engineer Job Description with Python, React, SQL, Node, REST API, Communication")
    questions = AIService.generate_candidate_interview(resume_info, jd_info)
    
    session = InterviewSession(
        user_id=1,
        title=f"AI Mock Interview: {req.target_role}",
        avatar_personality=req.avatar_personality or "Professional Tech Lead",
        status="ready"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "session_id": session.id,
        "title": session.title,
        "avatar_personality": session.avatar_personality,
        "questions": questions
    }

@router.post("/evaluate/{session_id}")
def evaluate_interview(session_id: int, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    questions = db.query(InterviewQuestion).filter(InterviewQuestion.session_id == session_id).all()
    answers = db.query(InterviewAnswer).filter(InterviewAnswer.session_id == session_id).all()

    # Map answers by question_id
    answers_map = {a.question_id: a for a in answers}

    qa_list = []
    for q in questions:
        ans = answers_map.get(q.id)
        ans_text = ans.candidate_audio_transcript if ans else "No response recorded."
        qa_list.append({
            "question": q.question_text,
            "expected_points": getattr(q, 'expected_answer_keypoints', []) or getattr(q, 'expected_points', []),
            "answer": ans_text
        })

    # Call dynamic AI assessment evaluator
    eval_data = AIService.evaluate_candidate_assessment(qa_list)

    # Save calculated scores into Database
    score_obj = db.query(Score).filter(Score.session_id == session_id).first()
    if not score_obj:
        score_obj = Score(session_id=session_id)
        db.add(score_obj)

    comm = float(eval_data.get("communication_score") or 85.0)
    conf = float(eval_data.get("confidence_score") or 85.0)
    tech = float(eval_data.get("technical_score") or 85.0)
    prof = float(eval_data.get("professionalism_score") or 85.0)
    overall = float(eval_data.get("overall_score_pct") or 85.0)

    score_obj.communication = comm
    score_obj.confidence = conf
    score_obj.technical_knowledge = tech
    score_obj.professionalism = prof
    score_obj.overall_score = overall
    score_obj.problem_solving = tech
    score_obj.eye_contact = conf
    score_obj.emotion_control = conf
    score_obj.voice_quality = comm

    # Save AI feedback details into Report
    report_obj = db.query(Report).filter(Report.reference_id == session_id, Report.report_type == "interview").first()
    if not report_obj:
        report_obj = Report(
            user_id=session.user_id or 1,
            report_type="interview",
            reference_id=session_id
        )
        db.add(report_obj)

    report_obj.summary = eval_data.get("summary") or f"Evaluation complete for session {session_id}."
    report_obj.strengths = eval_data.get("strengths") or []
    report_obj.weaknesses = eval_data.get("areas_for_improvement") or eval_data.get("weaknesses") or []
    report_obj.recommendations = eval_data.get("ai_recommendations") or eval_data.get("practice_recommendations") or []

    db.commit()

    return {
        "status": "success",
        "session_id": session_id,
        "evaluation": eval_data
    }

@router.post("/save-details")
def save_details(req: SaveInterviewRequest, db: Session = Depends(get_db)):
    # 1. Create InterviewSession
    session = InterviewSession(
        user_id=req.user_id or 1,
        title=req.title,
        status="completed",
        avatar_personality=req.avatar_personality or "Professional Tech Lead",
        duration_seconds=req.duration_seconds or 300,
        video_recording_url=req.video_recording_url
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # 2. Store Questions
    q_map = {} # Maps frontend question index or id to database InterviewQuestion objects
    for idx, q_data in enumerate(req.questions):
        question = InterviewQuestion(
            session_id=session.id,
            question_order=idx + 1,
            category=q_data.get("category", "Technical"),
            question_text=q_data.get("question_text") or q_data.get("questionText") or "",
            expected_answer_keypoints=q_data.get("expected_points") or q_data.get("expected_answer_keypoints") or []
        )
        db.add(question)
        db.commit()
        db.refresh(question)
        q_map[idx] = question.id
        # Also store mapping from frontend id if present
        if "id" in q_data:
            q_map[str(q_data["id"])] = question.id

    # 3. Store Answers & Transcripts
    for idx, ans_data in enumerate(req.answers):
        # Match back to the corresponding question
        q_ref = ans_data.get("question_id")
        q_db_id = None
        if q_ref is not None:
            q_db_id = q_map.get(str(q_ref)) or q_map.get(idx)
        else:
            q_db_id = q_map.get(idx)

        if not q_db_id:
            # Fallback to first question if mismatch
            q_db_id = list(q_map.values())[0] if q_map else 1

        answer = InterviewAnswer(
            session_id=session.id,
            question_id=q_db_id,
            candidate_audio_transcript=ans_data.get("candidate_audio_transcript") or ans_data.get("answer_text") or "No response",
            ideal_response_suggestion=ans_data.get("ideal_response_suggestion") or "",
            score=ans_data.get("score", 8.0),
            feedback=ans_data.get("feedback") or ""
        )
        db.add(answer)

        # Store candidate transcript entry
        cand_transcript = Transcript(
            session_id=session.id,
            speaker="Candidate",
            text=ans_data.get("candidate_audio_transcript") or ans_data.get("answer_text") or "No response"
        )
        db.add(cand_transcript)

    # 4. Store overall Score metrics
    score_obj = Score(
        session_id=session.id,
        overall_score=req.score.get("overall_score") or req.score.get("overall") or 80.0,
        technical_knowledge=req.score.get("technical_knowledge") or req.score.get("technical") or 80.0,
        communication=req.score.get("communication") or 80.0,
        confidence=req.score.get("confidence") or 80.0,
        professionalism=req.score.get("professionalism") or 80.0,
        problem_solving=req.score.get("problem_solving") or 80.0,
        eye_contact=req.score.get("eye_contact") or 80.0,
        emotion_control=req.score.get("emotion_control") or 80.0,
        voice_quality=req.score.get("voice_quality") or 80.0
    )
    db.add(score_obj)

    # 5. Create a clean assessment Report
    report = Report(
        user_id=req.user_id or 1,
        report_type="interview",
        reference_id=session.id,
        summary=f"Assessment session completed for role: {req.title}. Proctor warning strikes logged: {req.proctor_strikes}.",
        strengths=["Good response matching expected points.", "Stable voice metrics."],
        weaknesses=[req.termination_reason] if req.termination_reason else [],
        recommendations=["Continue practicing dynamic mock interviews."]
    )
    db.add(report)

    db.commit()

    return {
        "status": "success",
        "session_id": session.id,
        "message": "All interview details, questions, answers, and video recording info successfully saved to backend database!"
    }

@router.post("/upload-recording/{session_id}")
async def upload_recording(session_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    upload_dir = os.path.join("uploads", "recordings")
    os.makedirs(upload_dir, exist_ok=True)

    filename = f"session_{session_id}_{int(datetime.datetime.utcnow().timestamp())}.webm"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    normalized_path = file_path.replace("\\", "/")
    session.video_recording_url = normalized_path
    db.commit()

    return {
        "status": "success",
        "video_recording_url": normalized_path,
        "message": "Webcam video recording successfully uploaded and stored!"
    }

@router.get("/sessions")
def list_sessions(db: Session = Depends(get_db)):
    sessions = db.query(InterviewSession).order_by(InterviewSession.created_at.desc()).all()
    result = []
    for s in sessions:
        score = db.query(Score).filter(Score.session_id == s.id).first()
        score_pct = int(score.overall_score) if score else 85
        result.append({
            "id": s.id,
            "title": s.title,
            "duration_seconds": s.duration_seconds,
            "video_recording_url": s.video_recording_url,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "score_pct": score_pct,
            "technical_score": int(score.technical_knowledge) if score else 85,
            "communication_score": int(score.communication) if score else 85,
            "confidence_score": int(score.confidence) if score else 85,
            "proctor_strikes": getattr(s, 'proctor_strikes', None),
            "termination_reason": getattr(s, 'termination_reason', None)
        })
    return result

@router.get("/session/{session_id}")
def get_session_details(session_id: int, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    questions = db.query(InterviewQuestion).filter(InterviewQuestion.session_id == session_id).all()
    answers = db.query(InterviewAnswer).filter(InterviewAnswer.session_id == session_id).all()
    score = db.query(Score).filter(Score.session_id == session_id).first()
    report = db.query(Report).filter(Report.reference_id == session_id).first()

    return {
        "id": session.id,
        "title": session.title,
        "duration_seconds": session.duration_seconds,
        "video_recording_url": session.video_recording_url,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "proctor_strikes": getattr(session, 'proctor_strikes', None),
        "termination_reason": getattr(session, 'termination_reason', None),
        "questions": [
            {
                "id": q.id,
                "category": q.category,
                "topic": getattr(q, 'topic', "General"),
                "question_text": q.question_text,
                "expected_points": getattr(q, 'expected_answer_keypoints', []) or getattr(q, 'expected_points', [])
            } for q in questions
        ],
        "answers": [
            {
                "id": a.id,
                "question_id": a.question_id,
                "candidate_audio_transcript": a.candidate_audio_transcript,
                "ideal_response_suggestion": a.ideal_response_suggestion,
                "score": a.score,
                "feedback": a.feedback
            } for a in answers
        ],
        "score": {
            "overall_score": score.overall_score if score else 85.0,
            "technical_knowledge": score.technical_knowledge if score else 85.0,
            "communication": score.communication if score else 85.0,
            "confidence": score.confidence if score else 85.0,
            "professionalism": score.professionalism if score else 85.0,
            "problem_solving": score.problem_solving if score else 85.0,
            "eye_contact": score.eye_contact if score else 85.0,
            "emotion_control": score.emotion_control if score else 85.0,
            "voice_quality": score.voice_quality if score else 85.0
        } if score else None,
        "report": {
            "summary": report.summary if report else "Report completed.",
            "strengths": report.strengths if report else [],
            "weaknesses": report.weaknesses if report else [],
            "recommendations": report.recommendations if report else []
        } if report else None
    }

@router.delete("/session/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    return {"status": "success", "message": f"Session {session_id} deleted successfully"}

@router.delete("/sessions/clear")
def clear_all_sessions(db: Session = Depends(get_db)):
    db.query(InterviewAnswer).delete()
    db.query(InterviewQuestion).delete()
    db.query(Transcript).delete()
    db.query(Score).delete()
    db.query(Report).delete()
    db.query(InterviewSession).delete()
    db.commit()
    return {"status": "success", "message": "All interview sessions cleared successfully"}

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    from app.config import settings
    content = await file.read()
    
    url = "https://api.groq.com/openai/v1/audio/transcriptions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}"
    }
    
    files = {
        "file": (file.filename or "audio.webm", content, file.content_type or "audio/webm")
    }
    data = {
        "model": "whisper-large-v3",
        "response_format": "json"
    }
    
    try:
        response = requests.post(url, headers=headers, files=files, data=data)
        if response.status_code == 200:
            result = response.json()
            return {"text": result.get("text", "")}
        else:
            raise HTTPException(status_code=response.status_code, detail=f"Whisper failed: {response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-ultravox-call")
async def create_ultravox_call(body: dict):
    """
    Creates a real-time Ultravox voice call session for the AI interviewer.
    Accepts: { questions: [...], candidate_name: str, role: str }
    Returns: { joinUrl: str, callId: str }
    """
    ultravox_key = settings.ULTRAVOX_API_KEY or os.getenv("ULTRAVOX_API_KEY", "") or "dnCSFxGk.mrIc16B5G3af7WuaIcUZsuDWqYrPvUxq"
    if not ultravox_key or ultravox_key == "your_ultravox_api_key_here":
        raise HTTPException(
            status_code=400,
            detail="ULTRAVOX_API_KEY is not configured. Please add it to your backend/.env file. Get your key at https://app.ultravox.ai"
        )

    questions = body.get("questions", [])
    candidate_name = body.get("candidate_name", "the candidate")
    role = body.get("role", "Software Engineer")
    experience_level = body.get("experience_level", "Mid-Level")

    # Build numbered question list for the system prompt
    question_lines = "\n".join(
        [f"{i+1}. {q.get('question_text', q.get('questionText', ''))}" for i, q in enumerate(questions)]
    ) if questions else "1. Tell me about yourself and your background."

    num_qs = len(questions) if questions else 1
    last_q_text = questions[-1].get('question_text', questions[-1].get('questionText', '')) if questions else ""
    first_q_text = questions[0].get('question_text', questions[0].get('questionText', '')) if questions else "Tell me about yourself and your background."
    system_prompt = f"""You are Advika, an expert AI Interview Presenter conducting a live 1-on-1 technical interview with {candidate_name} for the position of {role} ({experience_level} level).

YOUR ROLE & PERSONA:
- You are asking {candidate_name} these technical interview questions directly in a warm, professional, and clear tone.
- Address {candidate_name} directly as the interviewee.
- Ask each question clearly and directly as a live interviewer.
- DO NOT just read numbers or robotically label questions (do NOT say "Question 1 colon"). Ask the questions naturally and directly!

ASSIGNED INTERVIEW QUESTIONS TO ASK {candidate_name}:
{question_lines}

PACING & VOICE CLARITY:
- Speak at a natural, calm, and clear pace (around 120 words per minute).
- Pause briefly after asking a question so {candidate_name} can answer.

INTERVIEW FLOW:
1. WELCOME & READINESS:
   Say: "Hello {candidate_name}! I am Advika, your AI Virtual Presenter, and I will be conducting your technical assessment today. Shall we start the interview?"
   - IF {candidate_name} agrees ("yes", "ready", "start", "sure", "okay", "begin"): Say "Great, let's begin!" and ask the first question: "{first_q_text}".
   - IF {candidate_name} declines ("no", "discontinue", "stop", "exit", "cancel"): Say "Understood. Discontinuing the interview session as requested. Have a great day!" and conclude call.

2. ASKING QUESTIONS #1 TO #{num_qs-1}:
   - Listen attentively while {candidate_name} answers. Do NOT interrupt while they are speaking.
   - Wait for {candidate_name} to finish answering and explicitly say "next question", "move to next", "I'm done", or "finished".
   - When requested, acknowledge briefly (e.g., "Thank you, {candidate_name}. Here is your next question:") and ask the next question directly.

3. FINAL QUESTION (Question #{num_qs}):
   - Ask the final question directly to {candidate_name}.
   - When {candidate_name} finishes and says "next question", "done", or "finished":
     Say: "Thank you for completing all the questions, {candidate_name}! Your evaluation report is being generated now. Please wait a moment."
     Conclude the call.

STRICT RULES:
- Always wait for {candidate_name} to finish speaking and say "next question" or "I'm done" before moving forward.
- Keep the interaction focused, professional, and directly engaging."""

    payload = {
        "systemPrompt": system_prompt,
        "model": "fixie-ai/ultravox-70B",
        "voice": "Jessica",
        "temperature": 0.05,
        "firstSpeaker": "FIRST_SPEAKER_AGENT",
        "medium": {"webRtc": {}}
    }

    try:
        response = requests.post(
            "https://api.ultravox.ai/api/calls",
            headers={
                "X-API-Key": ultravox_key,
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=15
        )

        if response.status_code in (200, 201):
            data = response.json()
            return {
                "joinUrl": data.get("joinUrl"),
                "callId": data.get("callId", "")
            }
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Ultravox API error: {response.text}"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create Ultravox call: {str(e)}")
