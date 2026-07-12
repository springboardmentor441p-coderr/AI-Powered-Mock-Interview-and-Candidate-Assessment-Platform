"""
Application-wide DI container.

The only place that reads `AI_SERVICE_PROVIDER` and `EMAIL_PROVIDER`
settings and maps them to concrete adapter classes. All services depend
on interfaces (ports); this module wires the ports to adapters at
runtime. Adding a new LLM/email provider means editing one branch
here - no application service changes needed.

Usage:
    from core.container import container
    container.session_service().create_session(...)
"""
from dependency_injector import containers, providers


# ---------------------------------------------------------------------------
# Plain factory functions (readable, individually unit-testable)
# ---------------------------------------------------------------------------

# --- AI providers (via AIProviderFactory) -----------------------------------
def _make_ai_factory(provider: str, realtime_voice_provider: str):
    from apps.ai.factories.provider_factory import AIProviderFactory
    return AIProviderFactory(provider=provider, realtime_voice_provider=realtime_voice_provider)

# --- Resume services --------------------------------------------------------
def _make_upload_service():
    from apps.resume.services.upload_service import UploadService
    return UploadService()

def _make_parsing_service():
    from apps.resume.services.parsing_service import ParsingService
    return ParsingService()

def _make_extraction_service(ai_factory):
    from apps.resume.services.extraction_service import ExtractionService
    return ExtractionService(provider=ai_factory.resume_extraction())

def _make_summary_service():
    from apps.resume.services.summary_service import SummaryService
    return SummaryService()

# --- Identity services ------------------------------------------------------
def _make_user_repository():
    from apps.identity.repositories.user_repository import UserRepository
    return UserRepository()

def _make_auth_service(user_repo):
    from apps.identity.services.auth_service import AuthService
    return AuthService(user_repository=user_repo)

def _make_user_service(user_repo):
    from apps.identity.services.user_service import UserService
    return UserService(user_repository=user_repo)

# --- Interview services -----------------------------------------------------
def _make_session_service(ai_factory):
    from apps.interview.services.session_service import SessionService
    return SessionService(question_provider=ai_factory.question_generation())

def _make_seed_topic_service(ai_factory):
    from apps.interview.services.seed_topic_service import SeedTopicService
    return SeedTopicService(provider=ai_factory.seed_topic_generation())

def _make_interview_orchestrator(ai_factory):
    from apps.interview.services.orchestrator_service import InterviewOrchestrator
    return InterviewOrchestrator(realtime_provider=ai_factory.realtime_voice())

# --- Assessment services ----------------------------------------------------
def _make_speech_analysis_service(ai_factory):
    from apps.assessment.services.speech_analysis_service import SpeechAnalysisService
    return SpeechAnalysisService(
        stt=ai_factory.speech_to_text(),
        communication=ai_factory.communication_analysis(),
        emotion=ai_factory.emotion_detection(),
        eye_contact=ai_factory.eye_contact_tracking(),
    )

def _make_scoring_service():
    from apps.assessment.services.scoring_service import ScoringService
    return ScoringService()

def _make_feedback_service(ai_factory):
    from apps.assessment.services.feedback_service import FeedbackService
    return FeedbackService(provider=ai_factory.feedback_generation())

# --- Notification services --------------------------------------------------
def _make_email_provider(email_provider: str):
    if email_provider == "sendgrid":
        from apps.notification.providers.sendgrid import SendGridEmailProvider
        return SendGridEmailProvider()
    from apps.notification.providers.smtp import SMTPEmailProvider
    return SMTPEmailProvider()

def _make_email_service(email_provider_instance):
    from apps.notification.services.email_service import EmailService
    return EmailService(provider=email_provider_instance)

def _make_notification_service(email_service):
    from apps.notification.services.reminder_service import NotificationService
    return NotificationService(email_service=email_service)

def _make_reminder_service(notification_service):
    from apps.notification.services.reminder_service import ReminderService
    return ReminderService(notification_service=notification_service)

# --- Analytics services -----------------------------------------------------
def _make_dashboard_service():
    from apps.analytics.services.dashboard_service import DashboardService
    return DashboardService()


# ---------------------------------------------------------------------------
# Container wiring
# ---------------------------------------------------------------------------
class Container(containers.DeclarativeContainer):
    config = providers.Configuration()

    # AI provider factory - single factory, passed to any service that needs an AI provider
    ai_factory = providers.Factory(
        _make_ai_factory,
        provider=config.ai_provider,
        realtime_voice_provider=config.realtime_voice_provider,
    )

    # Identity
    user_repository = providers.Factory(_make_user_repository)
    auth_service = providers.Factory(_make_auth_service, user_repo=user_repository)
    user_service = providers.Factory(_make_user_service, user_repo=user_repository)

    # Resume
    upload_service = providers.Factory(_make_upload_service)
    parsing_service = providers.Factory(_make_parsing_service)
    extraction_service = providers.Factory(_make_extraction_service, ai_factory=ai_factory)
    summary_service = providers.Factory(_make_summary_service)

    # Interview
    session_service = providers.Factory(_make_session_service, ai_factory=ai_factory)
    seed_topic_service = providers.Factory(_make_seed_topic_service, ai_factory=ai_factory)
    interview_orchestrator = providers.Factory(_make_interview_orchestrator, ai_factory=ai_factory)

    # Assessment
    speech_analysis_service = providers.Factory(_make_speech_analysis_service, ai_factory=ai_factory)
    scoring_service = providers.Factory(_make_scoring_service)
    feedback_service = providers.Factory(_make_feedback_service, ai_factory=ai_factory)

    # Notification
    email_provider = providers.Factory(_make_email_provider, email_provider=config.email_provider)
    email_service = providers.Factory(_make_email_service, email_provider_instance=email_provider)
    notification_service = providers.Factory(_make_notification_service, email_service=email_service)
    reminder_service = providers.Factory(_make_reminder_service, notification_service=notification_service)

    # Analytics
    dashboard_service = providers.Factory(_make_dashboard_service)


def _build_container() -> Container:
    from django.conf import settings
    instance = Container()
    ai_provider = getattr(settings, "AI_SERVICE_PROVIDER", "mock")
    instance.config.ai_provider.from_value(ai_provider)
    instance.config.realtime_voice_provider.from_value(
        getattr(settings, "REALTIME_VOICE_PROVIDER", None) or ai_provider
    )
    instance.config.email_provider.from_value(getattr(settings, "EMAIL_PROVIDER", "smtp"))
    return instance


container = _build_container()