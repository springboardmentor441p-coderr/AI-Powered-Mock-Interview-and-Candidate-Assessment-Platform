"""
Analytics selectors (read side).

Pure query functions - no mutations, no business logic. They are the
only place that issues cross-domain aggregation queries (joining
interview, assessment, identity data), so analytics concerns never
leak into domain services.
"""
from django.db.models import Avg, Count, Max

from apps.assessment.models import FinalScore
from apps.identity.models import User
from apps.interview.models import InterviewSession


def candidate_performance_summary(*, candidate: User) -> dict:
    agg = FinalScore.objects.filter(session__candidate=candidate).aggregate(
        average_overall=Avg("overall"),
        average_communication=Avg("communication"),
        average_confidence=Avg("confidence"),
        average_technical=Avg("technical_relevance"),
        average_professionalism=Avg("professionalism"),
        best_score=Max("overall"),
        total_sessions=Count("id"),
    )
    return {k: (round(v, 2) if isinstance(v, float) else (v or 0)) for k, v in agg.items()}


def candidate_score_trend(*, candidate: User, limit: int = 20) -> list[dict]:
    scores = (
        FinalScore.objects.filter(session__candidate=candidate)
        .select_related("session")
        .order_by("-created_at")[:limit]
    )
    return [
        {
            "session_id": str(s.session_id),
            "overall_score": s.overall,
            "rating": s.rating,
            "interview_type": s.session.interview_type,
            "date": s.created_at,
        }
        for s in reversed(list(scores))
    ]


def weak_area_prediction(*, candidate: User) -> list[str]:
    summary = candidate_performance_summary(candidate=candidate)
    avgs = {
        "communication": summary.get("average_communication") or 0,
        "confidence": summary.get("average_confidence") or 0,
        "technical_relevance": summary.get("average_technical") or 0,
        "professionalism": summary.get("average_professionalism") or 0,
    }
    sorted_cats = sorted(avgs.items(), key=lambda kv: kv[1])
    return [cat for cat, val in sorted_cats if val < 65][:2] or [sorted_cats[0][0]]


def candidate_rankings(*, limit: int = 50) -> list[dict]:
    rows = (
        FinalScore.objects.values(
            "session__candidate__id",
            "session__candidate__email",
            "session__candidate__first_name",
            "session__candidate__last_name",
        )
        .annotate(average_score=Avg("overall"), sessions_completed=Count("id"))
        .order_by("-average_score")[:limit]
    )
    return [
        {
            "candidate_id": str(r["session__candidate__id"]),
            "email": r["session__candidate__email"],
            "name": f"{r['session__candidate__first_name']} {r['session__candidate__last_name']}".strip(),
            "average_score": round(r["average_score"] or 0, 2),
            "sessions_completed": r["sessions_completed"],
        }
        for r in rows
    ]


def platform_overview() -> dict:
    return {
        "total_candidates": User.objects.filter(role=User.Role.CANDIDATE).count(),
        "total_sessions": InterviewSession.objects.count(),
        "completed_sessions": InterviewSession.objects.filter(status=InterviewSession.Status.COMPLETED).count(),
        "average_overall_score": round(
            FinalScore.objects.aggregate(avg=Avg("overall"))["avg"] or 0, 2
        ),
        "sessions_by_type": list(
            InterviewSession.objects.values("interview_type")
            .annotate(count=Count("id"))
            .order_by("-count")
        ),
    }


def compare_candidates(*, candidate_ids: list[str]) -> list[dict]:
    results = []
    for cid in candidate_ids:
        agg = FinalScore.objects.filter(session__candidate_id=cid).aggregate(
            average_overall=Avg("overall"), total_sessions=Count("id")
        )
        results.append({"candidate_id": cid, **agg})
    return results
