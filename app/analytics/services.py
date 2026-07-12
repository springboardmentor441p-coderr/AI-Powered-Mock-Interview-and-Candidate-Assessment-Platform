"""
Analytics service for dashboards and charts.
"""
from typing import Any

from sqlalchemy import func

from app.extensions import db
from app.models import Interview, Resume, Role, Score, SystemLog, User
from app.utils.constants import INTERVIEW_COMPLETED, ROLE_CANDIDATE, ROLE_RECRUITER


class AnalyticsService:
    """Platform analytics and dashboard data."""

    @staticmethod
    def get_candidate_dashboard(user_id: int) -> dict[str, Any]:
        """
        Get candidate dashboard data.

        Args:
            user_id: Candidate user ID.

        Returns:
            Dashboard data dictionary.
        """
        interviews = (
            Interview.query.filter_by(candidate_id=user_id)
            .order_by(Interview.created_at.desc())
            .all()
        )
        completed = [i for i in interviews if i.status == INTERVIEW_COMPLETED]
        scores = [i.score.overall_score for i in completed if i.score]

        resume = Resume.query.filter_by(user_id=user_id, is_primary=True).first()

        trend_labels = []
        trend_scores = []
        for interview in reversed(completed[-10:]):
            if interview.score:
                trend_labels.append(interview.title[:20])
                trend_scores.append(interview.score.overall_score)

        skill_labels = []
        skill_counts = []
        if resume:
            for skill in resume.skills.limit(10):
                skill_labels.append(skill.name)
                skill_counts.append(1)

        return {
            "total_interviews": len(interviews),
            "completed_interviews": len(completed),
            "average_score": round(sum(scores) / len(scores), 1) if scores else 0,
            "resume": resume,
            "interviews": interviews[:10],
            "trend_labels": trend_labels,
            "trend_scores": trend_scores,
            "skill_labels": skill_labels,
            "skill_counts": skill_counts,
        }

    @staticmethod
    def get_recruiter_dashboard() -> dict[str, Any]:
        """
        Get recruiter dashboard data.

        Returns:
            Dashboard data dictionary.
        """
        candidates = (
            User.query.join(Role)
            .filter(Role.name == ROLE_CANDIDATE)
            .all()
        )

        rankings = []
        for candidate in candidates:
            completed = Interview.query.filter_by(
                candidate_id=candidate.id, status=INTERVIEW_COMPLETED
            ).all()
            scores = [i.score.overall_score for i in completed if i.score]
            avg = round(sum(scores) / len(scores), 1) if scores else 0
            rankings.append(
                {
                    "id": candidate.id,
                    "name": candidate.full_name or candidate.username,
                    "email": candidate.email,
                    "interview_count": len(completed),
                    "average_score": avg,
                }
            )

        rankings.sort(key=lambda x: x["average_score"], reverse=True)

        domain_stats = (
            db.session.query(Interview.domain, func.count(Interview.id))
            .filter_by(status=INTERVIEW_COMPLETED)
            .group_by(Interview.domain)
            .all()
        )

        return {
            "total_candidates": len(candidates),
            "rankings": rankings[:20],
            "domain_labels": [d[0] or "Unknown" for d in domain_stats],
            "domain_counts": [d[1] for d in domain_stats],
            "total_interviews": Interview.query.filter_by(
                status=INTERVIEW_COMPLETED
            ).count(),
        }

    @staticmethod
    def get_admin_dashboard() -> dict[str, Any]:
        """
        Get admin dashboard data.

        Returns:
            Dashboard data dictionary.
        """
        total_users = User.query.count()
        total_candidates = (
            User.query.join(Role).filter(Role.name == ROLE_CANDIDATE).count()
        )
        total_recruiters = (
            User.query.join(Role).filter(Role.name == ROLE_RECRUITER).count()
        )
        total_interviews = Interview.query.count()
        completed_interviews = Interview.query.filter_by(
            status=INTERVIEW_COMPLETED
        ).count()
        total_resumes = Resume.query.count()

        avg_score_result = db.session.query(func.avg(Score.overall_score)).scalar()
        avg_score = round(avg_score_result, 1) if avg_score_result else 0

        recent_logs = (
            SystemLog.query.order_by(SystemLog.created_at.desc()).limit(20).all()
        )

        monthly_stats = (
            db.session.query(
                func.strftime("%Y-%m", Interview.created_at),
                func.count(Interview.id),
            )
            .group_by(func.strftime("%Y-%m", Interview.created_at))
            .order_by(func.strftime("%Y-%m", Interview.created_at))
            .limit(12)
            .all()
        )

        return {
            "total_users": total_users,
            "total_candidates": total_candidates,
            "total_recruiters": total_recruiters,
            "total_interviews": total_interviews,
            "completed_interviews": completed_interviews,
            "total_resumes": total_resumes,
            "average_score": avg_score,
            "recent_logs": recent_logs,
            "monthly_labels": [m[0] for m in monthly_stats],
            "monthly_counts": [m[1] for m in monthly_stats],
        }

    @staticmethod
    def compare_candidates(candidate_ids: list[int]) -> list[dict]:
        """
        Compare multiple candidates by performance.

        Args:
            candidate_ids: List of candidate user IDs.

        Returns:
            Comparison data list.
        """
        results = []
        for cid in candidate_ids:
            user = User.query.get(cid)
            if not user:
                continue
            interviews = Interview.query.filter_by(
                candidate_id=cid, status=INTERVIEW_COMPLETED
            ).all()
            if not interviews:
                continue
            latest = interviews[-1]
            score = latest.score
            results.append(
                {
                    "name": user.full_name or user.username,
                    "domain": latest.domain,
                    "overall": score.overall_score if score else 0,
                    "technical": score.technical_score if score else 0,
                    "communication": score.communication_score if score else 0,
                    "confidence": score.confidence_score if score else 0,
                }
            )
        return results
