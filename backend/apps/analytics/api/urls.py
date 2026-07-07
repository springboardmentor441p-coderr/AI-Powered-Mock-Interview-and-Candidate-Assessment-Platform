from django.urls import path

from apps.analytics.api.views.analytics_views import (
    CandidateDashboardView, CandidatePerformanceSummaryView, CandidateReportView,
    CandidateScoreTrendView, CandidateWeakAreasView, PlatformOverviewView,
    RecruiterCandidateRankingsView, RecruiterDashboardView,
)

app_name = "analytics"

urlpatterns = [
    # Candidate
    path("candidate/dashboard/", CandidateDashboardView.as_view(), name="candidate_dashboard"),
    path("candidate/summary/", CandidatePerformanceSummaryView.as_view(), name="candidate_summary"),
    path("candidate/trend/", CandidateScoreTrendView.as_view(), name="candidate_trend"),
    path("candidate/weak-areas/", CandidateWeakAreasView.as_view(), name="candidate_weak_areas"),
    path("candidate/report/", CandidateReportView.as_view(), name="candidate_report"),
    # Recruiter / Admin
    path("recruiter/dashboard/", RecruiterDashboardView.as_view(), name="recruiter_dashboard"),
    path("recruiter/rankings/", RecruiterCandidateRankingsView.as_view(), name="recruiter_rankings"),
    path("recruiter/overview/", PlatformOverviewView.as_view(), name="platform_overview"),
]
