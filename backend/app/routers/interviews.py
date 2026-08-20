import asyncio
import json
import logging
import os
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..dependencies import require_roles
from ..models import Interview, InterviewProfile, InterviewQuestion, InterviewQuestionEvaluation, Resume, Role, User
from ..schemas import AnswerRequest, ConversationAdvanceRequest, ConversationTurnOut, ConversationTurnRequest, FeedbackOut, InterviewOut, InterviewStartRequest
from ..services.resume_analysis import evaluate_answer, extract_pdf_text, extract_resume_context, is_meaningful_answer, practice_feedback
from ..services.conversation_memory import ConversationMemory, InterviewStage
from ..services.evaluator import normalize_llm_evaluation
from ..services.interview_agent import InterviewAgent
from ..services.llm_service import LLMService
from ..services.resume_context import ResumeContext
from ..services.report_generator import build_report_request, parse_report
from ..services.notifications import notify_interview_completed

router = APIRouter(prefix="/interviews", tags=["interviews"])
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
DURATION_CONFIG = {
    10: {"seconds": 600, "questions": 7},
    20: {"seconds": 1200, "questions": 12},
    30: {"seconds": 1800, "questions": 18},
}
DEFAULT_DURATION_MINUTES = 10


def interview_config(interview: Interview) -> dict:
    """Return the immutable duration/question configuration for this session."""
    if not interview.profile:
        return DURATION_CONFIG[DEFAULT_DURATION_MINUTES]
    try:
        context = json.loads(interview.profile.resume_context or "{}")
    except json.JSONDecodeError:
        context = {}
    duration = int(context.get("duration_minutes", DEFAULT_DURATION_MINUTES))
    return DURATION_CONFIG.get(duration, DURATION_CONFIG[DEFAULT_DURATION_MINUTES])


def time_limit_reached(interview: Interview) -> bool:
    config = interview_config(interview)
    return (datetime.utcnow() - interview.created_at).total_seconds() >= config["seconds"]


def main_questions(interview: Interview) -> list[InterviewQuestion]:
    """Return only real interview questions; the order_number=0 opening is not scored/countable."""
    return [question for question in interview.questions if question.order_number > 0]


def complete_interview(interview: Interview, db: Session) -> dict:
    interview.status = "completed"
    interview.ended_at = datetime.utcnow()
    notify_interview_completed(db, interview.candidate_id, interview.id)
    db.commit()
    return response_for(get_interview(interview.id, interview.candidate_id, db))
logger = logging.getLogger(__name__)

def get_interview(interview_id: int, user_id: int, db: Session) -> Interview:
    interview = db.scalar(select(Interview).options(selectinload(Interview.questions), selectinload(Interview.profile)).where(Interview.id == interview_id, Interview.candidate_id == user_id))
    if not interview:
        raise HTTPException(404, "Interview not found")
    return interview

def resume_profile(resume: Resume | None) -> tuple[list[str], bool, dict]:
    if not resume:
        return [], False, {}
    text = extract_pdf_text(UPLOAD_DIR / resume.stored_name)
    context = extract_resume_context(text)
    return context["skills"], bool(text), context

def skills_for(resume: Resume | None) -> tuple[list[str], bool]:
    skills, has_text, _ = resume_profile(resume)
    return skills, has_text

def store_evaluation(db: Session, question: InterviewQuestion, skills: list[str]) -> None:
    result = evaluate_answer(question.question, question.answer_text or "", skills)
    evaluation = db.scalar(select(InterviewQuestionEvaluation).where(InterviewQuestionEvaluation.question_id == question.id))
    if not evaluation:
        evaluation = InterviewQuestionEvaluation(question_id=question.id)
        db.add(evaluation)
    for field, value in result.items():
        setattr(evaluation, field, value)

def acknowledgement_for(interview: Interview, db: Session, question: InterviewQuestion) -> str:
    """Return a brief, contextual acknowledgement only when it adds value."""
    if "do you have any questions about the role or team" in question.question.lower():
        return "Thanks for your time today. It was great speaking with you. We'll follow up soon."
    evaluation = db.scalar(select(InterviewQuestionEvaluation).where(InterviewQuestionEvaluation.question_id == question.id))
    if not evaluation or evaluation.score < 45:
        return ""
    answer = (question.answer_text or "").lower()
    if any(word in answer for word in ("challenge", "issue", "error", "problem")):
        acknowledgement = "That makes sense."
    elif any(word in answer for word in ("built", "implemented", "designed", "created")):
        acknowledgement = "Interesting."
    elif evaluation.score >= 75:
        acknowledgement = "That's a good explanation."
    else:
        acknowledgement = "I see."
    _, context, _, _ = session_context(interview)
    state = context.setdefault("llm_state", {})
    if state.get("last_acknowledgement") == acknowledgement:
        return ""
    state["last_acknowledgement"] = acknowledgement
    if interview.profile:
        interview.profile.resume_context = json.dumps(context)
    return acknowledgement

def session_context(interview: Interview) -> tuple[list[str], dict, str, str]:
    profile = interview.profile
    if not profile:
        return [], {}, "your target role", "Intermediate"
    try:
        context = json.loads(profile.resume_context or "{}")
    except json.JSONDecodeError:
        context = {}
    return context.get("skills", []), context, profile.role_title, profile.difficulty

def response_for(interview: Interview, skills: list[str] | None = None) -> dict:
    return {"id": interview.id, "status": interview.status, "current_question": interview.current_question, "created_at": interview.created_at, "ended_at": interview.ended_at, "questions": interview.questions, "detected_skills": skills or [], "duration_minutes": int((json.loads(interview.profile.resume_context or "{}").get("duration_minutes", DEFAULT_DURATION_MINUTES)) if interview.profile else DEFAULT_DURATION_MINUTES), "target_questions": interview_config(interview)["questions"]}


def stage_for(context: dict, question_count: int) -> InterviewStage:
    saved = (context.get("llm_state") or {}).get("stage")
    remaining = (context.get("llm_state") or {}).get("remaining_seconds")
    if isinstance(remaining, int) and remaining <= 90:
        return InterviewStage.CLOSING
    try:
        return InterviewStage(saved)
    except ValueError:
        stages = (InterviewStage.WARM_UP, InterviewStage.INTRODUCTION, InterviewStage.EXPERIENCE, InterviewStage.PROJECTS, InterviewStage.TECHNICAL, InterviewStage.BEHAVIORAL, InterviewStage.CLOSING)
        return stages[min(question_count, len(stages) - 1)]


def save_llm_state(interview: Interview, context: dict, decision, remaining_seconds: int | None) -> None:
    profile = interview.profile
    if not profile:
        return
    state = context.get("llm_state") or {}
    state.update({
        "stage": decision.stage.value,
        "current_topic": decision.topic,
        "topics_explored": list(dict.fromkeys([*state.get("topics_explored", []), *decision.covered_topics, *([decision.topic] if decision.topic else [])])),
        "topics_remaining": decision.next_topics,
        "follow_up_depth": state.get("follow_up_depth", 0) + 1 if decision.action == "follow_up" else 0,
        "closing_question_asked": decision.action == "closing",
        "remaining_seconds": remaining_seconds,
    })
    context["llm_state"] = state
    profile.resume_context = json.dumps(context)


def llm_agent_for(interview: Interview, db: Session) -> tuple[InterviewAgent, ResumeContext]:
    """Rehydrate vendor-neutral memory from the existing interview records."""
    skills, context, role_title, _ = session_context(interview)
    resume_text = ""
    resume = db.get(Resume, interview.resume_id) if interview.resume_id else None
    if resume:
        resume_text = extract_pdf_text(UPLOAD_DIR / resume.stored_name)
    state = context.get("llm_state") or {}
    memory = ConversationMemory(
        candidate_resume=resume_text,
        job_description=str(context.get("job_description", "")),
        candidate_skills=skills,
        company_name=context.get("company_name"),
        target_role=role_title,
        interview_type=str(context.get("interview_type") or (interview.profile.mode if interview.profile else "general")),
        interview_stage=stage_for(context, len(main_questions(interview))),
        # A persisted topic is useful only when the candidate actually stated it.
        # This prevents a stale LLM inference or resume field from becoming a claim.
        current_technical_topic=None,
        remaining_seconds=state.get("remaining_seconds"),
        topics_explored=state.get("topics_explored", []),
        topics_remaining=state.get("topics_remaining", []),
        follow_up_depth=state.get("follow_up_depth", 0),
    )
    for question in main_questions(interview):
        memory.record_question(question.question)
        if question.answer_text:
            evaluation = db.scalar(select(InterviewQuestionEvaluation).where(InterviewQuestionEvaluation.question_id == question.id))
            memory.record_answer(question.answer_text, score=evaluation.score if evaluation else None, feedback=evaluation.feedback if evaluation else None)
    saved_topic = state.get("current_topic")
    if isinstance(saved_topic, str) and memory.candidate_history_mentions(saved_topic):
        memory.current_technical_topic = saved_topic
    return InterviewAgent(memory=memory), ResumeContext.from_mapping({**context, "resume_text": resume_text, "candidate_skills": skills})


def llm_next_question(interview: Interview, db: Session):
    """Return an LLM decision or None so the established generator can take over."""
    try:
        agent, resume_context = llm_agent_for(interview, db)
        return asyncio.run(agent.decide_next_question(LLMService(), resume_context))
    except Exception as exc:
        logger.warning("LLM interview decision unavailable; using deterministic fallback: %s", exc)
        return None


def llm_report_for(interview: Interview, db: Session, fallback: dict) -> dict:
    """Enhance the existing report only when the configured LLM returns valid JSON."""
    try:
        agent, _ = llm_agent_for(interview, db)
        generated = parse_report(asyncio.run(LLMService().generate(build_report_request(agent.memory))).content)
        return {**fallback, **generated}
    except Exception as exc:
        logger.warning("LLM final report unavailable; using deterministic fallback: %s", exc)
        return fallback

@router.post("", response_model=InterviewOut, status_code=201)
def start_interview(payload: InterviewStartRequest | None = None, user: User = Depends(require_roles(Role.candidate)), db: Session = Depends(get_db)):
    payload = payload or InterviewStartRequest()
    resume = db.scalar(select(Resume).where(Resume.owner_id == user.id).order_by(Resume.uploaded_at.desc())) if payload.mode == "resume" else None
    if payload.mode == "resume" and not resume:
        raise HTTPException(400, "Upload a resume before starting a resume-based interview")
    skills, has_resume_text, context = resume_profile(resume)
    interview = Interview(candidate_id=user.id, resume_id=resume.id if resume else None)
    db.add(interview); db.flush()
    role_title = payload.role_title or context.get("suggested_role", "your target role")
    context["interview_type"] = payload.interview_type
    context["duration_minutes"] = payload.duration_minutes
    db.add(InterviewProfile(interview_id=interview.id, role_title=role_title, mode=payload.mode, difficulty=payload.difficulty, experience_level=payload.experience_level, resume_context=json.dumps(context)))
    # The opening is a separate conversational turn. It is intentionally stored
    # outside the numbered interview-question sequence so it is never evaluated
    # or counted toward the configured question limit.
    opening_question = "Hi there! Thanks for joining today. Are you ready to begin?"
    db.add(InterviewQuestion(interview_id=interview.id, order_number=0, question=opening_question))
    db.commit()
    return response_for(get_interview(interview.id, user.id, db), skills)

@router.get("", response_model=list[InterviewOut])
def list_interviews(user: User = Depends(require_roles(Role.candidate)), db: Session = Depends(get_db)):
    interviews = db.scalars(select(Interview).options(selectinload(Interview.questions)).where(Interview.candidate_id == user.id).order_by(Interview.created_at.desc())).all()
    return [response_for(item, skills_for(db.get(Resume, item.resume_id))[0]) for item in interviews]

@router.post("/{interview_id}/answer", response_model=InterviewOut)
def save_answer(interview_id: int, payload: AnswerRequest, user: User = Depends(require_roles(Role.candidate)), db: Session = Depends(get_db)):
    interview = get_interview(interview_id, user.id, db)
    if interview.status != "in_progress": raise HTTPException(400, "This interview has ended")
    if time_limit_reached(interview):
        complete_interview(interview, db)
        raise HTTPException(400, "Interview time has expired")
    current = interview.questions[interview.current_question]
    if current.order_number == 0:
        current.answer_text = payload.answer_text.strip()
        try:
            context = json.loads(interview.profile.resume_context or "{}") if interview.profile else {}
        except json.JSONDecodeError:
            context = {}
        context["intro_completed"] = True
        context["intro_response"] = payload.answer_text.strip()
        if interview.profile:
            interview.profile.resume_context = json.dumps(context)
        db.commit()
        return response_for(get_interview(interview_id, user.id, db))
    if not is_meaningful_answer(payload.answer_text):
        raise HTTPException(422, "Could you explain that with more detail and give one practical example?")
    interview.questions[interview.current_question].answer_text = payload.answer_text.strip()
    store_evaluation(db, interview.questions[interview.current_question], session_context(interview)[0])
    db.commit()
    return response_for(get_interview(interview_id, user.id, db))

@router.post("/{interview_id}/next", response_model=InterviewOut)
def next_question(interview_id: int, user: User = Depends(require_roles(Role.candidate)), db: Session = Depends(get_db)):
    interview = get_interview(interview_id, user.id, db)
    if interview.status != "in_progress": raise HTTPException(400, "This interview has ended")
    raise HTTPException(400, "Questions advance only after a meaningful answer is evaluated")

@router.post("/{interview_id}/turn", response_model=ConversationTurnOut)
def complete_conversation_turn(interview_id: int, payload: ConversationTurnRequest, user: User = Depends(require_roles(Role.candidate)), db: Session = Depends(get_db)):
    """Accumulate the current answer. A later advance request creates the next question."""
    interview = get_interview(interview_id, user.id, db)
    if interview.status != "in_progress":
        raise HTTPException(400, "This interview has ended")
    if time_limit_reached(interview):
        completed = complete_interview(interview, db)
        return {"interview": completed, "completed": True, "accepted": False, "follow_up_required": False, "acknowledgement": "", "status_message": "Interview time has expired."}

    current = interview.questions[interview.current_question]

    # The opening readiness exchange is not an interview answer. Store it only
    # as conversational context, then let the normal advance path generate the
    # first real LLM question. This prevents "I'm fine", "yes", etc. from
    # reaching the answer-quality evaluator.
    if current.order_number == 0:
        try:
            context = json.loads(interview.profile.resume_context or "{}") if interview.profile else {}
        except json.JSONDecodeError:
            context = {}
        context["intro_completed"] = True
        context["intro_response"] = payload.transcript.strip()
        if interview.profile:
            interview.profile.resume_context = json.dumps(context)
        current.answer_text = payload.transcript.strip()
        db.commit()
        updated = get_interview(interview_id, user.id, db)
        return {
            "interview": response_for(updated),
            "completed": False,
            "accepted": True,
            "follow_up_required": False,
            "acknowledgement": "Great. Let's get started.",
            "status_message": "Ready to begin the interview."
        }

    existing_evaluation = db.scalar(select(InterviewQuestionEvaluation).where(InterviewQuestionEvaluation.question_id == current.id))
    if existing_evaluation:
        raise HTTPException(400, "The current answer has already been accepted")
    current.answer_text = " ".join(part for part in [current.answer_text or "", payload.transcript.strip()] if part).strip()
    skills, context, role_title, difficulty = session_context(interview)
    if not is_meaningful_answer(current.answer_text):
        db.commit()
        updated = get_interview(interview_id, user.id, db)
        return {"interview": response_for(updated), "completed": False, "accepted": False, "follow_up_required": True, "acknowledgement": "", "status_message": "Could you explain that in more detail and give one practical example?"}
    store_evaluation(db, current, skills)
    acknowledgement = acknowledgement_for(interview, db, current)
    db.commit()
    updated = get_interview(interview_id, user.id, db)
    return {"interview": response_for(updated), "completed": False, "accepted": True, "follow_up_required": False, "acknowledgement": acknowledgement, "status_message": "Answer accepted."}

@router.post("/{interview_id}/advance", response_model=ConversationTurnOut)
def advance_after_acknowledgement(interview_id: int, payload: ConversationAdvanceRequest | None = None, user: User = Depends(require_roles(Role.candidate)), db: Session = Depends(get_db)):
    """Create the next question only after the frontend has finished Nova's acknowledgement."""
    interview = get_interview(interview_id, user.id, db)
    if interview.status != "in_progress":
        raise HTTPException(400, "This interview has ended")
    if time_limit_reached(interview):
        completed = complete_interview(interview, db)
        return {"interview": completed, "completed": True, "accepted": True, "follow_up_required": False, "acknowledgement": "", "status_message": "Interview time has expired. Preparing your assessment."}
    current = interview.questions[interview.current_question]
    accepted = db.scalar(select(InterviewQuestionEvaluation).where(InterviewQuestionEvaluation.question_id == current.id))
    if current.order_number != 0 and not accepted:
        raise HTTPException(400, "The current answer must be accepted before advancing")

    target_questions = interview_config(interview)["questions"]
    answered_main_questions = len(main_questions(interview))
    # The current question has already been answered, so finish at the
    # configured limit instead of generating the next question. The opening
    # turn has order_number=0 and is excluded from this count.
    if answered_main_questions >= target_questions:
        interview.status = "completed"
        interview.ended_at = datetime.utcnow()
        notify_interview_completed(db, interview.candidate_id, interview.id)
        db.commit()
        updated = get_interview(interview_id, user.id, db)
        return {
            "interview": response_for(updated),
            "completed": True,
            "accepted": True,
            "follow_up_required": False,
            "acknowledgement": "",
            "status_message": f"Interview complete. You have completed all {target_questions} questions.",
        }
    skills, context, role_title, difficulty = session_context(interview)
    state = context.get("llm_state") or {}

    history = [{"question": question.question, "answer": question.answer_text or ""} for question in main_questions(interview)]
    if payload and interview.profile:
        context.setdefault("llm_state", {})["remaining_seconds"] = payload.remaining_seconds
        interview.profile.resume_context = json.dumps(context)
    decision = llm_next_question(interview, db)
    if decision:
        next_question_text = decision.question
        save_llm_state(interview, context, decision, payload.remaining_seconds if payload else None)
        evaluation = db.scalar(select(InterviewQuestionEvaluation).where(InterviewQuestionEvaluation.question_id == current.id))
        if evaluation:
            for field, value in normalize_llm_evaluation(decision.evaluation).items():
                setattr(evaluation, field, value)
    else:
        # Gemini can be unavailable or return invalid structured output. Reuse the
        # same ConversationMemory so the deterministic path obeys warm-up grounding.
        fallback_agent, _ = llm_agent_for(interview, db)
        next_question_text = fallback_agent.safe_fallback_question(
            skills=skills,
            role_title=role_title,
            difficulty=difficulty,
            context=context,
        )
    next_order = answered_main_questions + 1
    db.add(InterviewQuestion(interview_id=interview.id, order_number=next_order, question=next_question_text))
    # The opening occupies index 0; each generated main question follows it.
    interview.current_question = len(interview.questions)
    db.commit()
    updated = get_interview(interview_id, user.id, db)
    return {"interview": response_for(updated), "completed": False, "accepted": True, "follow_up_required": False, "acknowledgement": "", "status_message": "Nova is ready with the next question."}

@router.post("/{interview_id}/end", response_model=InterviewOut)
def end_interview(interview_id: int, user: User = Depends(require_roles(Role.candidate)), db: Session = Depends(get_db)):
    interview = get_interview(interview_id, user.id, db)
    answered = sum(bool(question.answer_text and is_meaningful_answer(question.answer_text)) for question in main_questions(interview))
    interview.status = "completed" if answered else "incomplete"
    interview.ended_at = datetime.utcnow()
    if interview.status == "completed":
        notify_interview_completed(db, interview.candidate_id, interview.id)
    db.commit()
    return response_for(get_interview(interview_id, user.id, db))

@router.post("/{interview_id}/timeout", response_model=InterviewOut)
def end_interview_at_time_limit(interview_id: int, user: User = Depends(require_roles(Role.candidate)), db: Session = Depends(get_db)):
    """Finish a timed practice session after its current answer has been handled."""
    interview = get_interview(interview_id, user.id, db)
    evaluated_answers = db.scalars(
        select(InterviewQuestionEvaluation.question_id)
        .join(InterviewQuestion, InterviewQuestion.id == InterviewQuestionEvaluation.question_id)
        .where(InterviewQuestion.interview_id == interview.id)
    ).all()
    interview.status = "completed" if evaluated_answers else "incomplete"
    interview.ended_at = datetime.utcnow()
    if interview.status == "completed":
        notify_interview_completed(db, interview.candidate_id, interview.id)
    db.commit()
    return response_for(get_interview(interview_id, user.id, db))

@router.delete("/{interview_id}", status_code=204)
def discard_interview(interview_id: int, user: User = Depends(require_roles(Role.candidate)), db: Session = Depends(get_db)):
    """Discard an unanswered session so it never appears in history or analytics."""
    interview = get_interview(interview_id, user.id, db)
    if any(question.answer_text and question.answer_text.strip() for question in main_questions(interview)):
        raise HTTPException(400, "Only an unanswered interview can be discarded")
    db.delete(interview)
    db.commit()

@router.get("/{interview_id}/report", response_model=FeedbackOut)
def interview_report(interview_id: int, user: User = Depends(require_roles(Role.candidate)), db: Session = Depends(get_db)):
    interview = get_interview(interview_id, user.id, db)
    if interview.status != "completed": raise HTTPException(400, "End the interview before viewing the practice report")
    target_questions = interview_config(interview)["questions"]
    return llm_report_for(interview, db, practice_feedback(interview.questions, session_context(interview)[0], total_questions=target_questions))