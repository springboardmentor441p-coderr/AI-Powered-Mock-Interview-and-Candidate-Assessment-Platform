"""
routers/dashboard.py — Analytics endpoints for candidate dashboard

GET /dashboard/stats        — score summary, session counts, streak
GET /dashboard/progress     — score trend over last N sessions
GET /dashboard/weak-areas   — which dimensions score lowest
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from backend.database import get_db
from backend.models.session import InterviewSession, SessionReport
from backend.models.user import User
from backend.routers.auth import get_current_user

router = APIRouter()


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return summary stats for the candidate dashboard header cards."""
    reports = db.scalars(
        select(SessionReport)
        .where(SessionReport.user_id == current_user.id)
        .order_by(SessionReport.created_at.desc())
    ).all()

    if not reports:
        return {
            "total_sessions": 0,
            "latest_score": 0,
            "best_score": 0,
            "avg_score": 0,
            "improvement_pct": 0,
            "streak": 0,
        }

    scores = [r.overall_score for r in reports]
    latest = scores[0]
    best   = max(scores)
    avg    = round(sum(scores) / len(scores), 1)

    # Simple improvement: compare latest to first
    improvement = 0
    if len(scores) >= 2:
        improvement = round(((latest - scores[-1]) / max(scores[-1], 1)) * 100, 1)

    return {
        "total_sessions": len(reports),
        "latest_score":   round(latest, 1),
        "best_score":     round(best, 1),
        "avg_score":      avg,
        "improvement_pct": improvement,
        "streak":         _calculate_streak(reports),
    }


@router.get("/progress")
def get_progress(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return score trend — last N sessions ordered oldest first (for chart)."""
    reports = db.scalars(
        select(SessionReport)
        .where(SessionReport.user_id == current_user.id)
        .order_by(SessionReport.created_at.desc())
        .limit(limit)
    ).all()

    # Reverse so chart goes oldest → newest
    reports = list(reversed(reports))

    return [
        {
            "session_id":         r.session_id,
            "overall_score":      round(r.overall_score, 1),
            "communication":      round(r.communication_score, 1),
            "confidence":         round(r.confidence_score, 1),
            "technical":          round(r.technical_score, 1),
            "professionalism":    round(r.professionalism_score, 1),
            "date":               r.created_at.isoformat(),
        }
        for r in reports
    ]


@router.get("/weak-areas")
def get_weak_areas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Identify which skill areas the candidate scores lowest on."""
    reports = db.scalars(
        select(SessionReport).where(SessionReport.user_id == current_user.id)
    ).all()

    if not reports:
        return []

    n = len(reports)
    avgs = {
        "Communication":   round(sum(r.communication_score   for r in reports) / n, 1),
        "Confidence":      round(sum(r.confidence_score      for r in reports) / n, 1),
        "Technical":       round(sum(r.technical_score       for r in reports) / n, 1),
        "Professionalism": round(sum(r.professionalism_score for r in reports) / n, 1),
    }

    # Sort by score ascending (weakest first)
    sorted_areas = sorted(avgs.items(), key=lambda x: x[1])
    return [{"area": k, "avg_score": v} for k, v in sorted_areas]


def _calculate_streak(reports) -> int:
    """Count consecutive days with at least one interview (simple version)."""
    if not reports:
        return 0
    from datetime import datetime, timezone
    today  = datetime.now().date()
    streak = 0
    seen   = set()
    for r in sorted(reports, key=lambda x: x.created_at, reverse=True):
        day = r.created_at.date()
        if day not in seen:
            seen.add(day)
            expected = today - __import__('datetime').timedelta(days=streak)
            if day == expected:
                streak += 1
            else:
                break
    return streak

from pydantic import BaseModel
import openai

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
def chat_with_bot(
    req: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        client = openai.OpenAI()
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are NEXIQ AI, a helpful assistant for the SmartHire platform."},
                {"role": "user", "content": req.message}
            ],
            max_tokens=150
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        return {"response": f"Error: {str(e)}"}
