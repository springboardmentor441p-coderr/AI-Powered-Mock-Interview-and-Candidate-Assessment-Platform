from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard & Analytics"])


@router.get("/summary", response_model=schemas.DashboardSummary)
def summary(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    interviews = db.query(models.Interview).filter(
        models.Interview.candidate_id == current_user.id,
        models.Interview.status == "completed",
    ).order_by(models.Interview.completed_at.asc()).all()

    if not interviews:
        return schemas.DashboardSummary(
            total_interviews=0, average_overall_score=0, best_score=0,
            latest_rating=None, score_trend=[], skill_breakdown={},
        )

    scores = [i.overall_score for i in interviews]
    trend = [
        {
            "interview_id": i.id,
            "date": i.completed_at.isoformat() if i.completed_at else None,
            "overall_score": i.overall_score,
            "communication": i.communication_score,
            "confidence": i.confidence_score,
            "technical": i.technical_score,
            "professionalism": i.professionalism_score,
            "type": i.interview_type,
        }
        for i in interviews
    ]

    skill_breakdown = {
        "communication": round(sum(i.communication_score for i in interviews) / len(interviews), 1),
        "confidence": round(sum(i.confidence_score for i in interviews) / len(interviews), 1),
        "technical": round(sum(i.technical_score for i in interviews) / len(interviews), 1),
        "professionalism": round(sum(i.professionalism_score for i in interviews) / len(interviews), 1),
    }

    return schemas.DashboardSummary(
        total_interviews=len(interviews),
        average_overall_score=round(sum(scores) / len(scores), 1),
        best_score=max(scores),
        latest_rating=interviews[-1].rating,
        score_trend=trend,
        skill_breakdown=skill_breakdown,
    )


@router.get("/recruiter/candidates")
def recruiter_view(db: Session = Depends(get_db), current_user: models.User = Depends(auth.require_roles("recruiter", "admin"))):
    """Recruiters/Admins can view aggregate candidate performance for comparison."""
    candidates = db.query(models.User).filter(models.User.role == "candidate").all()
    results = []
    for c in candidates:
        completed = [i for i in c.interviews if i.status == "completed"]
        if not completed:
            continue
        avg = round(sum(i.overall_score for i in completed) / len(completed), 1)
        results.append({
            "candidate_id": c.id,
            "full_name": c.full_name,
            "email": c.email,
            "interviews_completed": len(completed),
            "average_overall_score": avg,
            "latest_rating": completed[-1].rating,
        })
    results.sort(key=lambda r: r["average_overall_score"], reverse=True)
    return results
