from typing import Any, cast

from django.conf import settings
from rest_framework import generics, status
from rest_framework.request import Request
from rest_framework.views import APIView

from core.permissions import IsCandidate
from core.responses import APIResponse

from apps.resume.api.serializers import ResumeSerializer, ResumeUploadSerializer
from apps.resume.models import Resume
from apps.resume.selectors.resume_selector import get_owned_resume_or_404


class ResumeListView(generics.ListAPIView):
    serializer_class = ResumeSerializer
    permission_classes = [IsCandidate]

    def get_queryset(self):  # type: ignore[override]
        return Resume.objects.filter(candidate=self.request.user).prefetch_related("extracted_skills")


class ResumeUploadView(APIView):
    permission_classes = [IsCandidate]

    def post(self, request: Request, *args: Any, **kwargs: Any):
        from core.container import container
        from apps.resume.tasks.resume_tasks import process_resume_task

        serializer = ResumeUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = cast(dict[str, Any], serializer.validated_data)

        upload_service = container.upload_service()
        resume = upload_service.upload(
            candidate=request.user,
            file=data["file"],
            make_primary=data.get("make_primary", True),
        )
        process_resume_task.delay(str(resume.id))  # type: ignore[union-attr]
        return APIResponse.created(
            data=ResumeSerializer(resume).data,
            message="Resume uploaded and queued for processing.",
        )


class ResumeDetailView(generics.RetrieveAPIView):
    serializer_class = ResumeSerializer
    permission_classes = [IsCandidate]
    lookup_url_kwarg = "resume_id"

    def get_queryset(self):  # type: ignore[override]
        return Resume.objects.filter(candidate=self.request.user).prefetch_related("extracted_skills")


class ResumeReprocessView(APIView):
    permission_classes = [IsCandidate]

    def post(self, request: Request, resume_id: str, *args: Any, **kwargs: Any):
        from apps.resume.tasks.resume_tasks import process_resume_task

        get_owned_resume_or_404(candidate=request.user, resume_id=resume_id)
        process_resume_task.delay(str(resume_id))  # type: ignore[union-attr]
        return APIResponse.success(message="Resume queued for reprocessing.", http_status=status.HTTP_202_ACCEPTED)


class ResumeSetPrimaryView(APIView):
    """
    POST /api/v1/resumes/<resume_id>/set-primary/

    Makes the given resume the candidate's primary resume and demotes all others.
    Only processed resumes can be made primary.
    """
    permission_classes = [IsCandidate]

    def post(self, request: Request, resume_id: str, *args: Any, **kwargs: Any):
        from apps.resume.repositories.resume_repository import ResumeRepository

        resume = get_owned_resume_or_404(candidate=request.user, resume_id=resume_id)
        if resume.status != Resume.Status.PROCESSED:
            return APIResponse.error(
                message="Only a fully processed résumé can be set as primary.",
                http_status=status.HTTP_400_BAD_REQUEST,
            )
        repo = ResumeRepository()
        repo.set_all_non_primary(candidate=request.user, exclude_id=resume.pk)
        repo.update(resume, is_primary=True)
        return APIResponse.success(data=ResumeSerializer(resume).data)
