from rest_framework import permissions
from rest_framework.views import APIView

from core.permissions import IsCandidate
from core.responses import APIResponse

from apps.candidate.api.serializers import CandidateProfileSerializer
from apps.candidate.services.profile_service import CandidateProfileService


class CandidateProfileView(APIView):
    permission_classes = [IsCandidate]

    def get(self, request, *args, **kwargs):
        profile = getattr(request.user, "candidate_profile", None)
        return APIResponse.success(data=CandidateProfileSerializer(profile).data if profile else None)

    def patch(self, request, *args, **kwargs):
        serializer = CandidateProfileSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        service = CandidateProfileService()
        profile = service.update_profile(user=request.user, **serializer.validated_data)  # type: ignore[arg-type]
        return APIResponse.success(data=CandidateProfileSerializer(profile).data)
