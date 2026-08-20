import json

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..dependencies import current_user, require_roles
from ..models import Interview, Role, User
from ..schemas import AssessmentOut, CandidateAnalyticsOut
from ..services.report_generator import generate_interview_report_pdf
from ..services.resume_analysis import derive_strengths_and_weaknesses, practice_feedback
from .interviews import interview_config, main_questions

router = APIRouter(prefix="/assessments", tags=["assessments"])


def assessment_feedback(interview: Interview) -> dict | None:
    try:
        skills = json.loads(interview.profile.resume_context or "{}").get("skills", []) if interview.profile else []
    except json.JSONDecodeError:
        skills = []
    target_questions = interview_config(interview)["questions"]
    if interview.status != "completed":
        return None
    return practice_feedback(main_questions(interview), skills, total_questions=target_questions)


def assessment_row(interview: Interview, include_candidate: bool = False) -> dict:
    result = assessment_feedback(interview)
    has_score = bool(result and result.get("score") is not None)
    target_questions = interview_config(interview)["questions"]
    row = {
        "interview_id": interview.id,
        "status": interview.status,
        "created_at": interview.created_at,
        "ended_at": interview.ended_at,
        "score": result["score"] if result else None,
        "answered_questions": result["answered_questions"] if result else sum(bool(q.answer_text) for q in main_questions(interview)),
        "total_questions": target_questions,
        "communication": result.get("communication") if has_score else None,
        "technical_knowledge": result.get("technical_knowledge") if has_score else None,
        "confidence": result.get("confidence") if has_score else None,
        "problem_solving": result.get("problem_solving") if has_score else None,
    }
    if include_candidate:
        row.update({"candidate_id": interview.candidate.id, "candidate_name": interview.candidate.full_name, "candidate_email": interview.candidate.email})
    return row


@router.get("/my-history", response_model=list[AssessmentOut])
def my_history(user: User = Depends(require_roles(Role.candidate)), db: Session = Depends(get_db)):
    interviews = db.scalars(
        select(Interview).options(selectinload(Interview.questions), selectinload(Interview.profile)).where(Interview.candidate_id == user.id, Interview.status == "completed").order_by(Interview.created_at.desc())
    ).all()
    return [assessment_row(item) for item in interviews]


@router.get("/recruiter", response_model=list[AssessmentOut])
def recruiter_assessments(_: User = Depends(require_roles(Role.recruiter, Role.admin)), db: Session = Depends(get_db)):
    interviews = db.scalars(
        select(Interview).options(selectinload(Interview.questions), selectinload(Interview.profile), selectinload(Interview.candidate)).where(Interview.status == "completed").order_by(Interview.ended_at.desc())
    ).all()
    return [assessment_row(item, include_candidate=True) for item in interviews]


@router.get("/analytics", response_model=CandidateAnalyticsOut)
def candidate_analytics(user: User = Depends(require_roles(Role.candidate)), db: Session = Depends(get_db)):
    """Aggregate, real-data-only analytics for the candidate dashboard. No fake/hardcoded scores."""
    interviews = db.scalars(
        select(Interview).options(selectinload(Interview.questions), selectinload(Interview.profile)).where(Interview.candidate_id == user.id, Interview.status == "completed").order_by(Interview.created_at.desc())
    ).all()
    if not interviews:
        return CandidateAnalyticsOut(interviews_completed=0)

    rows = [assessment_row(item) for item in interviews]
    scored = [row for row in rows if row["score"] is not None]

    def average(key: str) -> int | None:
        values = [row[key] for row in scored if row.get(key) is not None]
        return round(sum(values) / len(values)) if values else None

    trend = [{"interview_id": row["interview_id"], "score": row["score"], "date": row["created_at"]} for row in reversed(scored)]

    combined_feedback = {
        "score": average("score"),
        "communication": average("communication"),
        "technical_knowledge": average("technical_knowledge"),
        "confidence": average("confidence"),
        "problem_solving": average("problem_solving"),
    }
    strengths, weaknesses = derive_strengths_and_weaknesses(combined_feedback)
    recommendations = [
        "Use the STAR method (situation, task, action, result) to structure each answer.",
        "Name the specific technical decision you made and quantify the outcome where possible.",
    ]
    if combined_feedback["communication"] is not None and combined_feedback["communication"] < 60:
        recommendations.insert(0, "Practice speaking in complete, structured sentences to raise your communication score.")
    if combined_feedback["technical_knowledge"] is not None and combined_feedback["technical_knowledge"] < 60:
        recommendations.insert(0, "Review core technical concepts for your target role before your next mock interview.")

    return CandidateAnalyticsOut(
        interviews_completed=len(rows),
        average_score=average("score"),
        best_score=max((row["score"] for row in scored), default=None),
        communication_score=average("communication"),
        confidence_score=average("confidence"),
        technical_relevance_score=average("technical_knowledge"),
        problem_solving_score=average("problem_solving"),
        performance_trend=trend,
        recent_history=rows[:5],
        strengths=strengths,
        weaknesses=weaknesses,
        recommendations=recommendations,
    )


def _authorize_report_access(interview: Interview, user: User) -> None:
    if user.role == Role.candidate and interview.candidate_id != user.id:
        raise HTTPException(403, "You can only download your own interview reports")


@router.get("/{interview_id}/report")
def download_report(interview_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Downloadable PDF assessment report. Candidates may only access their own; recruiters/admins may access any."""
    if user.role not in (Role.candidate, Role.recruiter, Role.admin):
        raise HTTPException(403, "Insufficient permissions")
    interview = db.scalar(
        select(Interview).options(selectinload(Interview.questions), selectinload(Interview.profile), selectinload(Interview.candidate)).where(Interview.id == interview_id)
    )
    if not interview:
        raise HTTPException(404, "Interview not found")
    _authorize_report_access(interview, user)
    if interview.status != "completed":
        raise HTTPException(400, "The report is available once the interview is completed")

    feedback = assessment_feedback(interview)
    if feedback is None:
        raise HTTPException(400, "No assessment data is available for this interview yet")

    pdf_bytes = generate_interview_report_pdf(
        candidate_name=interview.candidate.full_name,
        candidate_email=interview.candidate.email,
        interview_id=interview.id,
        created_at=interview.created_at,
        ended_at=interview.ended_at,
        feedback=feedback,
    )
    filename = f"interview-{interview.id}-report.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
