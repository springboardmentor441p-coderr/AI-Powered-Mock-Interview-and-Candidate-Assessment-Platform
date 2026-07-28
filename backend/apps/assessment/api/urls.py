from django.urls import path

from apps.assessment.api.views.assessment_views import (
    FinalScoreDetailView, RetriggerPipelineView, SessionFeedbackDetailView, SpeechAnalysisDetailView,
)
from apps.assessment.api.views.face_assessment_views import (
    FaceSnapshotIngestView,
    FaceSnapshotSummaryView,
)

app_name = "assessment"

urlpatterns = [
    # --- Existing assessment endpoints ---
    path("sessions/<uuid:session_id>/analysis/", SpeechAnalysisDetailView.as_view(), name="speech_analysis"),
    path("sessions/<uuid:session_id>/score/", FinalScoreDetailView.as_view(), name="final_score"),
    path("sessions/<uuid:session_id>/feedback/", SessionFeedbackDetailView.as_view(), name="session_feedback"),
    path("sessions/<uuid:session_id>/retrigger/", RetriggerPipelineView.as_view(), name="retrigger"),

    # --- Real-time face assessment (browser → server) ---
    # POST: ingest periodic snapshot from MediaPipe running in-browser
    path(
        "sessions/<uuid:session_id>/face-snapshots/",
        FaceSnapshotIngestView.as_view(),
        name="face_snapshot_ingest",
    ),
    # GET: aggregated summary (for results page / SpeechAnalysisService)
    path(
        "sessions/<uuid:session_id>/face-snapshots/summary/",
        FaceSnapshotSummaryView.as_view(),
        name="face_snapshot_summary",
    ),
]