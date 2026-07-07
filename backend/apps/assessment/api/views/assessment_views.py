from rest_framework.views import APIView

from core.exceptions import NotFoundError
from core.permissions import IsCandidate
from core.responses import APIResponse

from apps.assessment.api.serializers.assessment_serializer import (
    FinalScoreSerializer, SessionFeedbackSerializer, SpeechAnalysisSerializer,
)
from apps.interview.selectors.session_selector import get_owned_session_or_404


class SpeechAnalysisDetailView(APIView):
    permission_classes = [IsCandidate]

    def get(self, request, session_id, *args, **kwargs):
        session = get_owned_session_or_404(candidate=request.user, session_id=session_id)
        analysis = getattr(session, "speech_analysis", None)
        if analysis is None:
            raise NotFoundError("Speech analysis for this session has not been generated yet.")
        return APIResponse.success(data=SpeechAnalysisSerializer(analysis).data)


class FinalScoreDetailView(APIView):
    permission_classes = [IsCandidate]

    def get(self, request, session_id, *args, **kwargs):
        session = get_owned_session_or_404(candidate=request.user, session_id=session_id)
        score = getattr(session, "final_score", None)
        if score is None:
            raise NotFoundError("Score for this session has not been generated yet.")
        return APIResponse.success(data=FinalScoreSerializer(score).data)


class SessionFeedbackDetailView(APIView):
    permission_classes = [IsCandidate]

    def get(self, request, session_id, *args, **kwargs):
        session = get_owned_session_or_404(candidate=request.user, session_id=session_id)
        feedback = getattr(session, "feedback", None)
        if feedback is None:
            raise NotFoundError("Feedback for this session has not been generated yet.")
        return APIResponse.success(data=SessionFeedbackSerializer(feedback).data)


class RetriggerPipelineView(APIView):
    permission_classes = [IsCandidate]

    def post(self, request, session_id, *args, **kwargs):
        from apps.assessment.tasks.scoring_tasks import run_assessment_pipeline
        get_owned_session_or_404(candidate=request.user, session_id=session_id)
        run_assessment_pipeline.delay(str(session_id))  # type: ignore[union-attr]
        return APIResponse.success(message="Assessment pipeline re-queued.")
