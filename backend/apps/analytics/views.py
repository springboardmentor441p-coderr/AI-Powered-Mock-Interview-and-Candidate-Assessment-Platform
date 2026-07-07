from rest_framework.views import APIView

from apps.analytics.serializers import (
    CandidateRankingSerializer,
    PerformanceSummarySerializer,
    ScoreTrendPointSerializer,
)
from apps.analytics.services import DashboardService
from core.permissions import IsCandidate, IsRecruiterOrAdmin
from core.responses import APIResponse
from apps.analytics.selectors import analytics_selector


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


class RecruiterCandidateRankingsView(APIView):
    permission_classes = [IsRecruiterOrAdmin]

    def get(self, request, *args, **kwargs):
        rankings = analytics_selector.candidate_rankings()
        return APIResponse.success(data=CandidateRankingSerializer(rankings, many=True).data)


class PlatformOverviewView(APIView):
    permission_classes = [IsRecruiterOrAdmin]

    def get(self, request, *args, **kwargs):
        service = DashboardService()
        return APIResponse.success(data=service.recruiter_dashboard())
