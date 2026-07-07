from django.urls import path

from apps.analytics.views import (
    CandidatePerformanceSummaryView,
    CandidateScoreTrendView,
    CandidateWeakAreasView,
    PlatformOverviewView,
    RecruiterCandidateRankingsView,
)

app_name = "analytics"

urlpatterns = [
    path("candidate/summary/", CandidatePerformanceSummaryView.as_view(), name="candidate_summary"),
    path("candidate/trend/", CandidateScoreTrendView.as_view(), name="candidate_trend"),
    path("candidate/weak-areas/", CandidateWeakAreasView.as_view(), name="candidate_weak_areas"),
    path("recruiter/rankings/", RecruiterCandidateRankingsView.as_view(), name="recruiter_rankings"),
    path("recruiter/overview/", PlatformOverviewView.as_view(), name="platform_overview"),
]
