from django.urls import path

from apps.assessment.api.views.assessment_views import (
    FinalScoreDetailView, RetriggerPipelineView, SessionFeedbackDetailView, SpeechAnalysisDetailView,
)

app_name = "assessment"

urlpatterns = [
    path("sessions/<uuid:session_id>/analysis/", SpeechAnalysisDetailView.as_view(), name="speech_analysis"),
    path("sessions/<uuid:session_id>/score/", FinalScoreDetailView.as_view(), name="final_score"),
    path("sessions/<uuid:session_id>/feedback/", SessionFeedbackDetailView.as_view(), name="session_feedback"),
    path("sessions/<uuid:session_id>/retrigger/", RetriggerPipelineView.as_view(), name="retrigger"),
]
