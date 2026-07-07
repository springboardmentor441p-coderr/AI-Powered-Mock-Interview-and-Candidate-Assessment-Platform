from rest_framework.views import APIView

from core.permissions import IsCandidate, IsRecruiterOrAdmin
from core.responses import APIResponse

from apps.analytics.api.serializers.analytics_serializer import (
    CandidateRankingSerializer, PerformanceSummarySerializer, ScoreTrendPointSerializer,
)
from apps.analytics.selectors import analytics_selector
from apps.analytics.services.dashboard_service import DashboardService, ReportService


class CandidateDashboardView(APIView):
    """Full dashboard payload (summary + trend + weak areas) in one call."""
    permission_classes = [IsCandidate]

    def get(self, request, *args, **kwargs):
        service = DashboardService()
        return APIResponse.success(data=service.candidate_dashboard(candidate=request.user))


class CandidatePerformanceSummaryView(APIView):
    permission_classes = [IsCandidate]

    def get(self, request, *args, **kwargs):
        summary = analytics_selector.candidate_performance_summary(candidate=request.user)
        return APIResponse.success(data=PerformanceSummarySerializer(summary).data)


class CandidateScoreTrendView(APIView):
    permission_classes = [IsCandidate]

    def get(self, request, *args, **kwargs):
        trend = analytics_selector.candidate_score_trend(candidate=request.user)
        return APIResponse.success(data=ScoreTrendPointSerializer(trend, many=True).data)


class CandidateWeakAreasView(APIView):
    permission_classes = [IsCandidate]

    def get(self, request, *args, **kwargs):
        weak_areas = analytics_selector.weak_area_prediction(candidate=request.user)
        return APIResponse.success(data={"weak_areas": weak_areas})


class CandidateReportView(APIView):
    permission_classes = [IsCandidate]

    def get(self, request, *args, **kwargs):
        report = ReportService().candidate_report(candidate=request.user)
        return APIResponse.success(data=report)


class RecruiterDashboardView(APIView):
    permission_classes = [IsRecruiterOrAdmin]

    def get(self, request, *args, **kwargs):
        return APIResponse.success(data=DashboardService().recruiter_dashboard())


class RecruiterCandidateRankingsView(APIView):
    permission_classes = [IsRecruiterOrAdmin]

    def get(self, request, *args, **kwargs):
        rankings = analytics_selector.candidate_rankings()
        return APIResponse.success(data=CandidateRankingSerializer(rankings, many=True).data)


class PlatformOverviewView(APIView):
    permission_classes = [IsRecruiterOrAdmin]

    def get(self, request, *args, **kwargs):
        return APIResponse.success(data=analytics_selector.platform_overview())
