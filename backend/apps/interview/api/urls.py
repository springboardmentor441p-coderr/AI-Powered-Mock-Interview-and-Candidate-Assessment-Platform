from django.urls import path

from apps.interview.api.views.invitation_views import (
    AcceptInvitationView,
    ReceivedInvitationsView,
    RecruiterSessionHistoryView,
    SendInvitationView,
    SentInvitationsView,
)
from apps.interview.api.views.realtime_views import (
    SessionRealtimeAccountWebhookView,
    SessionRealtimeAbandonView,
    SessionRealtimeCreateView,
    SessionRealtimeStartView,
    SessionRealtimeToolAskNextQuestionView,
    SessionCurrentTopicView,
)
from apps.interview.api.views.session_views import (
    InterviewTemplateListCreateView, SessionAnswerView, SessionCompleteView,
    SessionCreateView, SessionDetailView, SessionListView, SessionStartView,
)
from apps.interview.api.views.transcript_views import (
    SessionInterviewBriefView,
    SessionThreadEvaluationListView,
    SessionTranscriptListView,
    SessionTranscriptWebhookView,
)

app_name = "interview"

urlpatterns = [
    path("templates/", InterviewTemplateListCreateView.as_view(), name="template_list"),

    # --- Scripted flow ---
    path("sessions/", SessionListView.as_view(), name="session_list"),
    path("sessions/create/", SessionCreateView.as_view(), name="session_create"),
    path("sessions/<uuid:session_id>/", SessionDetailView.as_view(), name="session_detail"),
    path("sessions/<uuid:session_id>/start/", SessionStartView.as_view(), name="session_start"),
    path("sessions/<uuid:session_id>/answer/", SessionAnswerView.as_view(), name="session_answer"),
    path("sessions/<uuid:session_id>/complete/", SessionCompleteView.as_view(), name="session_complete"),

    # --- Realtime voice flow ---
    path("realtime/sessions/create/", SessionRealtimeCreateView.as_view(), name="realtime_session_create"),
    path("realtime/sessions/<uuid:session_id>/start/", SessionRealtimeStartView.as_view(), name="realtime_session_start"),
    path("realtime/sessions/<uuid:session_id>/abandon/", SessionRealtimeAbandonView.as_view(), name="realtime_session_abandon"),

    # Transcript
    path("realtime/sessions/<uuid:session_id>/transcript/webhook/", SessionTranscriptWebhookView.as_view(), name="realtime_transcript_webhook"),
    path("realtime/sessions/<uuid:session_id>/transcript/full/", SessionTranscriptListView.as_view(), name="realtime_transcript_full"),

    # Evaluation
    path("realtime/sessions/<uuid:session_id>/thread-evaluations/", SessionThreadEvaluationListView.as_view(), name="realtime_thread_evaluations"),

    # Brief (GET + PATCH for human verdict)
    path("realtime/sessions/<uuid:session_id>/brief/", SessionInterviewBriefView.as_view(), name="realtime_interview_brief"),

    # Orchestrator tools
    path("realtime/sessions/<uuid:session_id>/tools/ask-next-question/", SessionRealtimeToolAskNextQuestionView.as_view(), name="realtime_tool_ask_next_question"),
    path("realtime/sessions/<uuid:session_id>/current-topic/", SessionCurrentTopicView.as_view(), name="realtime_current_topic"),
    path("realtime/webhooks/ultravox/", SessionRealtimeAccountWebhookView.as_view(), name="realtime_webhook_ultravox"),

    # --- Invitations ---
    path("invitations/send/", SendInvitationView.as_view(), name="invitation_send"),
    path("invitations/sent/", SentInvitationsView.as_view(), name="invitation_sent_list"),
    path("invitations/received/", ReceivedInvitationsView.as_view(), name="invitation_received_list"),
    path("invitations/<uuid:invitation_id>/accept/", AcceptInvitationView.as_view(), name="invitation_accept"),
    path("invitations/history/", RecruiterSessionHistoryView.as_view(), name="invitation_history"),
]
