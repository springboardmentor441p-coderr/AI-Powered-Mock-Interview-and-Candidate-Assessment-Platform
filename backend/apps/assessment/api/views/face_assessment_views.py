"""
Face Assessment endpoints — called from the browser during live interviews.

POST /api/v1/assessments/sessions/<session_id>/face-snapshots/
    Ingest one periodic face reading from MediaPipe running in the browser.
    Idempotent on (session, sequence) so duplicate deliveries are safe.

GET  /api/v1/assessments/sessions/<session_id>/face-snapshots/summary/
    Returns aggregated face metrics for the session so far.
    Used on the results page to show face-based confidence stats.
"""
from typing import cast

from rest_framework.views import APIView

from core.exceptions import NotFoundError, ValidationError as AppValidationError
from core.permissions import IsCandidate
from core.responses import APIResponse

from apps.assessment.api.serializers.face_assessment_serializer import (
    FaceAssessmentSummarySerializer,
    FaceSnapshotIngestSerializer,
)
from apps.assessment.services.face_assessment_service import FaceAssessmentService
from apps.interview.selectors.session_selector import get_owned_session_or_404


class FaceSnapshotIngestView(APIView):
    """
    POST — receive one face snapshot sent by the browser every ~2 s while
    the interview is live.

    Request body (JSON):
    {
        "sequence": 42,
        "face_detected": true,
        "gaze_on_screen": true,
        "eye_contact_score": 87.3,
        "attention_score": 91.0,
        "engagement_score": 89.1,
        "dominant_emotion": "neutral",
        "emotion_breakdown": {"neutral": 0.7, "happy": 0.2, "surprise": 0.1},
        "emotion_confidence": 72.4,
        "yaw": -2.1,
        "pitch": 4.5,
        "roll": 0.8
    }
    """

    permission_classes = [IsCandidate]

    def post(self, request, session_id, *args, **kwargs):
        session = get_owned_session_or_404(candidate=request.user, session_id=session_id)

        serializer = FaceSnapshotIngestSerializer(data=request.data)
        if not serializer.is_valid():
            raise AppValidationError(
                "Invalid face snapshot payload.",
                details=serializer.errors,
            )

        service = FaceAssessmentService()
        snapshot = service.create_snapshot(
            session=session,
            validated_data=cast(dict, serializer.validated_data),
        )

        return APIResponse.created(
            data={"id": str(snapshot.id), "sequence": snapshot.sequence},
            message="Face snapshot recorded.",
        )


class FaceSnapshotSummaryView(APIView):
    """
    GET — return aggregated face metrics for the session.
    Called from the frontend results page and by SpeechAnalysisService.
    """

    permission_classes = [IsCandidate]

    def get(self, request, session_id, *args, **kwargs):
        session = get_owned_session_or_404(candidate=request.user, session_id=session_id)

        service = FaceAssessmentService()
        data = service.aggregate(session=session)

        if data is None:
            raise NotFoundError("No face assessment snapshots recorded for this session yet.")

        serializer = FaceAssessmentSummarySerializer(data=data)
        serializer.is_valid()  # always valid — we control the shape from aggregate()

        return APIResponse.success(data=serializer.data)