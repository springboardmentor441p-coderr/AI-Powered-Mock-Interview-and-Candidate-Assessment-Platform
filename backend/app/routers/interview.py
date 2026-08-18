import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db
from ..services import question_generator, scoring_engine
from ..notifications_util import notify

router = APIRouter(prefix="/api/interviews", tags=["Interviews"])


@router.post("/", response_model=schemas.InterviewOut)
def start_interview(
    payload: schemas.InterviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    skills = None
    job_profile = question_generator.resolve_job_title(payload.job_title)
    domain = payload.domain if payload.domain and payload.domain != "general" else job_profile["domain"]
    skills = job_profile["skills"] or None

    if payload.resume_id:
        resume = db.query(models.Resume).filter(
            models.Resume.id == payload.resume_id, models.Resume.owner_id == current_user.id
        ).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        skills = list(set((skills or []) + (resume.skills or []))) or None

    interview = models.Interview(
        candidate_id=current_user.id,
        resume_id=payload.resume_id,
        interview_type=payload.interview_type,
        difficulty=payload.difficulty,
        domain=domain,
        job_title=payload.job_title,
        mode=payload.mode,
        time_limit_seconds=payload.time_limit_seconds,
        status="in_progress",
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)

    if payload.mode == "timed":
        # Timed AI interviews generate one question at a time, adaptively.
        first_q = question_generator.generate_next_question(
            interview_type=payload.interview_type, difficulty=payload.difficulty,
            domain=domain, skills=skills, exclude_texts=[], order_index=1,
        )
        db.add(models.InterviewQuestion(
            interview_id=interview.id, order_index=1,
            question_text=first_q["question_text"], category=first_q["category"],
        ))
    else:
        questions = question_generator.generate_questions(
            interview_type=payload.interview_type, difficulty=payload.difficulty,
            domain=domain, skills=skills, num_questions=payload.num_questions,
        )
        for q in questions:
            db.add(models.InterviewQuestion(
                interview_id=interview.id, order_index=q["order_index"],
                question_text=q["question_text"], category=q["category"],
            ))

    db.commit()
    db.refresh(interview)
    notify(db, current_user.id, f"New {payload.interview_type} interview started ({payload.mode} mode). Good luck!", "info")
    return interview


@router.post("/{interview_id}/next-question", response_model=schemas.QuestionOut)
def next_question(interview_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Adaptively generates the next question for a timed interview session, based on job title/domain."""
    interview = db.query(models.Interview).filter(
        models.Interview.id == interview_id, models.Interview.candidate_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if interview.mode != "timed":
        raise HTTPException(status_code=400, detail="Adaptive next-question is only available for timed interviews")

    existing = db.query(models.InterviewQuestion).filter(models.InterviewQuestion.interview_id == interview.id).all()
    exclude_texts = [q.question_text for q in existing]

    job_profile = question_generator.resolve_job_title(interview.job_title)
    skills = job_profile["skills"] or None

    next_q = question_generator.generate_next_question(
        interview_type=interview.interview_type, difficulty=interview.difficulty,
        domain=interview.domain, skills=skills, exclude_texts=exclude_texts,
        order_index=len(existing) + 1,
    )
    question = models.InterviewQuestion(
        interview_id=interview.id, order_index=next_q["order_index"],
        question_text=next_q["question_text"], category=next_q["category"],
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.get("/", response_model=List[schemas.InterviewResult])
def list_interviews(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Interview).filter(
        models.Interview.candidate_id == current_user.id
    ).order_by(models.Interview.created_at.desc()).all()


@router.get("/{interview_id}", response_model=schemas.InterviewOut)
def get_interview(interview_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    interview = db.query(models.Interview).filter(
        models.Interview.id == interview_id, models.Interview.candidate_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview


@router.post("/answer")
def submit_answer(
    payload: schemas.AnswerSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    question = db.query(models.InterviewQuestion).filter(models.InterviewQuestion.id == payload.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    interview = db.query(models.Interview).filter(
        models.Interview.id == question.interview_id, models.Interview.candidate_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    scores = scoring_engine.score_answer(
        question_category=question.category,
        answer_text=payload.answer_text,
        time_taken_seconds=payload.time_taken_seconds,
        eye_contact_pct=payload.eye_contact_pct,
        confidence_signal=payload.confidence_signal,
    )

    question.answer_text = payload.answer_text
    question.time_taken_seconds = payload.time_taken_seconds
    question.eye_contact_pct = payload.eye_contact_pct
    question.confidence_signal = payload.confidence_signal
    question.filler_word_count = scores["filler_word_count"]
    question.keyword_match_pct = scores["keyword_match_pct"]
    db.commit()

    return {
        "status": "answer recorded",
        "question_id": question.id,
        "preview_scores": scores,
        "feedback": scoring_engine.generate_answer_feedback(question.category, payload.answer_text, scores),
    }


@router.post("/{interview_id}/complete", response_model=schemas.InterviewResult)
def complete_interview(interview_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    interview = db.query(models.Interview).filter(
        models.Interview.id == interview_id, models.Interview.candidate_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    questions = db.query(models.InterviewQuestion).filter(models.InterviewQuestion.interview_id == interview.id).all()
    answered = [q for q in questions if q.answer_text]
    if not answered:
        raise HTTPException(status_code=400, detail="No answers submitted yet")

    per_question_scores = []
    for q in answered:
        scores = scoring_engine.score_answer(
            question_category=q.category,
            answer_text=q.answer_text,
            time_taken_seconds=q.time_taken_seconds,
            eye_contact_pct=q.eye_contact_pct,
            confidence_signal=q.confidence_signal,
        )
        per_question_scores.append(scores)

    agg = scoring_engine.aggregate_interview_score(per_question_scores)
    feedback = scoring_engine.generate_feedback(agg, per_question_scores)

    interview.communication_score = agg["communication_score"]
    interview.confidence_score = agg["confidence_score"]
    interview.technical_score = agg["technical_score"]
    interview.professionalism_score = agg["professionalism_score"]
    interview.overall_score = agg["overall_score"]
    interview.rating = agg["rating"]
    interview.strengths = feedback["strengths"]
    interview.weaknesses = feedback["weaknesses"]
    interview.recommendations = feedback["recommendations"]
    interview.status = "completed"
    interview.completed_at = datetime.datetime.utcnow()
    interview.duration_seconds = sum(q.time_taken_seconds for q in answered)

    db.commit()
    db.refresh(interview)
    notify(
        db, current_user.id,
        f"Your {interview.interview_type} interview is complete! Overall score: {interview.overall_score}/100 ({interview.rating}).",
        "success",
    )
    return interview


@router.get("/{interview_id}/report", response_class=PlainTextResponse)
def download_report(interview_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    interview = db.query(models.Interview).filter(
        models.Interview.id == interview_id, models.Interview.candidate_id == current_user.id
    ).first()
    if not interview or interview.status != "completed":
        raise HTTPException(status_code=404, detail="Completed interview not found")

    questions = db.query(models.InterviewQuestion).filter(models.InterviewQuestion.interview_id == interview.id).all()

    lines = [
        "=" * 60,
        "SmartHire AI — Interview Performance Report",
        "=" * 60,
        f"Candidate: {current_user.full_name} ({current_user.email})",
        f"Interview Type: {interview.interview_type.upper()} | Domain: {interview.domain} | Difficulty: {interview.difficulty}",
        f"Date: {interview.completed_at}",
        "",
        f"OVERALL SCORE: {interview.overall_score}/100  —  Rating: {interview.rating}",
        "",
        "Score Breakdown:",
        f"  Communication (30%):   {interview.communication_score}/100",
        f"  Confidence (25%):      {interview.confidence_score}/100",
        f"  Technical Relevance (30%): {interview.technical_score}/100",
        f"  Professionalism (15%): {interview.professionalism_score}/100",
        "",
        "Strengths:",
    ] + [f"  - {s}" for s in interview.strengths] + [
        "",
        "Areas to Improve:",
    ] + [f"  - {w}" for w in interview.weaknesses] + [
        "",
        "Recommendations:",
    ] + [f"  - {r}" for r in interview.recommendations] + [
        "",
        "-" * 60,
        "Question & Answer Log:",
        "-" * 60,
    ]

    for q in questions:
        lines.append(f"\nQ{q.order_index} [{q.category}]: {q.question_text}")
        lines.append(f"Answer: {q.answer_text or '(no answer submitted)'}")
        lines.append(f"Time taken: {q.time_taken_seconds}s | Filler words: {q.filler_word_count}")

    lines.append("\n" + "=" * 60)
    lines.append("Generated by SmartHire AI")

    return "\n".join(lines)
