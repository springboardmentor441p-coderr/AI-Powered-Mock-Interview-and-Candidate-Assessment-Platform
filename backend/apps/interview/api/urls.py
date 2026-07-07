from django.urls import path

from apps.interview.api.views.realtime_views import (
    SessionRealtimeAccountWebhookView, SessionRealtimeCreateView, SessionRealtimeStartView,
    SessionRealtimeToolAskNextQuestionView, SessionRealtimeTranscriptView,
)
from apps.interview.api.views.session_views import (
    InterviewTemplateListCreateView, SessionAnswerView, SessionCompleteView,
    SessionCreateView, SessionDetailView, SessionListView, SessionStartView,
)

app_name = "interview"

urlpatterns = [
    path("templates/", InterviewTemplateListCreateView.as_view(), name="template_list"),

    # --- Legacy scripted flow (kept for non-voice / fallback use) ---
    path("sessions/", SessionListView.as_view(), name="session_list"),
    path("sessions/create/", SessionCreateView.as_view(), name="session_create"),
    path("sessions/<uuid:session_id>/", SessionDetailView.as_view(), name="session_detail"),
    path("sessions/<uuid:session_id>/start/", SessionStartView.as_view(), name="session_start"),
    path("sessions/<uuid:session_id>/answer/", SessionAnswerView.as_view(), name="session_answer"),
    path("sessions/<uuid:session_id>/complete/", SessionCompleteView.as_view(), name="session_complete"),

    # --- Realtime voice conversation flow ---
    path("realtime/sessions/create/", SessionRealtimeCreateView.as_view(), name="realtime_session_create"),
    path("realtime/sessions/<uuid:session_id>/start/", SessionRealtimeStartView.as_view(), name="realtime_session_start"),
    path("realtime/sessions/<uuid:session_id>/transcript/", SessionRealtimeTranscriptView.as_view(), name="realtime_session_transcript"),
    path(
        "realtime/sessions/<uuid:session_id>/tools/ask-next-question/",
        SessionRealtimeToolAskNextQuestionView.as_view(), name="realtime_tool_ask_next_question",
    ),
    path("realtime/webhooks/ultravox/", SessionRealtimeAccountWebhookView.as_view(), name="realtime_webhook_ultravox"),
]
