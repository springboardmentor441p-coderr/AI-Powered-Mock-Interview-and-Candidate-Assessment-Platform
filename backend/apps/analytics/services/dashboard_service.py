"""
Dashboard service.

Wraps selector calls that need light orchestration (combining multiple
selectors, applying business rules to read results) without touching
any write path. Stateless - no repository dependencies.
"""
from core.services import BaseService
from apps.analytics.selectors import analytics_selector


class DashboardService(BaseService):
    def candidate_dashboard(self, *, candidate) -> dict:
        return {
            "summary": analytics_selector.candidate_performance_summary(candidate=candidate),
            "trend": analytics_selector.candidate_score_trend(candidate=candidate),
            "weak_areas": analytics_selector.weak_area_prediction(candidate=candidate),
        }

    def recruiter_dashboard(self) -> dict:
        return {
            "platform_overview": analytics_selector.platform_overview(),
            "top_candidates": analytics_selector.candidate_rankings(limit=10),
        }


class ReportService(BaseService):
    def candidate_report(self, *, candidate) -> dict:
        return {
            "candidate_email": candidate.email,
            "candidate_name": candidate.get_full_name(),
            "summary": analytics_selector.candidate_performance_summary(candidate=candidate),
            "score_trend": analytics_selector.candidate_score_trend(candidate=candidate, limit=50),
            "weak_areas": analytics_selector.weak_area_prediction(candidate=candidate),
        }
