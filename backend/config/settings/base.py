from datetime import timedelta
from pathlib import Path

import environ  # type: ignore[import-untyped]

from core.env import env_bool, env_db_url, env_int, env_list, env_str

BASE_DIR = Path(__file__).resolve().parent.parent.parent
env = environ.Env(DJANGO_DEBUG=(bool, False))
environ.Env.read_env(str(BASE_DIR / ".env"))

SECRET_KEY = env_str(env, "DJANGO_SECRET_KEY", default="insecure-dev-key-change-me")
DEBUG = env_bool(env, "DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = env_list(env, "DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "social_django",
]

LOCAL_APPS = [
    "apps.identity",
    "apps.candidate",
    "apps.resume",
    "apps.interview",
    "apps.assessment",
    "apps.analytics",
    "apps.notification",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "social_django.middleware.SocialAuthExceptionMiddleware",
    "core.middleware.RequestLoggingMiddleware",
    "core.middleware.ExceptionLoggingMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [BASE_DIR / "templates"],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.debug",
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
        "social_django.context_processors.backends",
        "social_django.context_processors.login_redirect",
    ]},
}]

DATABASES = {
    "default": env_db_url(
        env,
        "DATABASE_URL",
        default=(
            f"postgres://{env_str(env, 'POSTGRES_USER', default='smarthire')}:"
            f"{env_str(env, 'POSTGRES_PASSWORD', default='smarthire')}@"
            f"{env_str(env, 'POSTGRES_HOST', default='localhost')}:"
            f"{env_str(env, 'POSTGRES_PORT', default='5432')}/"
            f"{env_str(env, 'POSTGRES_DB', default='smarthire')}"
        ),
    )
}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "identity.User"

AUTHENTICATION_BACKENDS = [
    "social_core.backends.google.GoogleOAuth2",
    "django.contrib.auth.backends.ModelBackend",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = env_str(env, "GOOGLE_OAUTH2_CLIENT_ID", default="")
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = env_str(env, "GOOGLE_OAUTH2_CLIENT_SECRET", default="")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardResultsPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.AnonRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {"user": "1000/day", "anon": "100/day"},
    "EXCEPTION_HANDLER": "core.exceptions.handlers.custom_exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env_int(env, "ACCESS_TOKEN_LIFETIME_MIN", default=30)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env_int(env, "REFRESH_TOKEN_LIFETIME_DAYS", default=7)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "SmartHire AI API",
    "DESCRIPTION": "AI-Powered Mock Interview and Candidate Assessment Platform",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

CORS_ALLOWED_ORIGINS = env_list(env, "CORS_ALLOWED_ORIGINS", default=["http://localhost:3000"])
CORS_ALLOW_CREDENTIALS = True

CELERY_BROKER_URL = env_str(env, "CELERY_BROKER_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = env_str(env, "CELERY_RESULT_BACKEND", default="redis://localhost:6379/1")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_BEAT_SCHEDULE = {
    "send-interview-reminders": {
        "task": "apps.notification.tasks.reminder_tasks.send_reminder_task",
        "schedule": 3600.0,  # every hour
    },
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

RESUME_UPLOAD_MAX_SIZE_MB = 5
RESUME_ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"]

AI_SERVICE_PROVIDER = env_str(env, "AI_SERVICE_PROVIDER", default="mock")
EMAIL_PROVIDER = env_str(env, "EMAIL_PROVIDER", default="smtp")
OPENAI_API_KEY = env_str(env, "OPENAI_API_KEY", default="")
OPENAI_RESUME_MODEL = env_str(env, "OPENAI_RESUME_MODEL", default="gpt-4o-mini")
WHISPER_API_KEY = env_str(env, "WHISPER_API_KEY", default="")
GEMINI_API_KEY = env_str(env, "GEMINI_API_KEY", default="")
GEMINI_RESUME_MODEL = env_str(env, "GEMINI_RESUME_MODEL", default="gemini-2.5-flash")
# Model used for resume-aware seed topic generation (can differ from resume extraction
# model since seed topics benefit from more creative reasoning).
GEMINI_SEED_TOPIC_MODEL = env_str(env, "GEMINI_SEED_TOPIC_MODEL", default="gemini-2.5-flash")
SENDGRID_API_KEY = env_str(env, "SENDGRID_API_KEY", default="")

# Publicly reachable base URL for this backend, used to build the
# absolute webhook/tool-callback URLs handed to the realtime voice
# provider (Ultravox) when a call is created. In dev this typically
# needs to be a tunnel URL (ngrok/cloudflared) since Ultravox calls it
# from the outside, not localhost.
BACKEND_PUBLIC_URL = env_str(env, "BACKEND_PUBLIC_URL", default="http://localhost:8000")

# Realtime voice provider (Ultravox). Only required when
# AI_SERVICE_PROVIDER=ultravox; the "mock" realtime provider needs none
# of these. See apps/ai/providers/realtime_voice/ultravox_provider.py.
ULTRAVOX_API_KEY = env_str(env, "ULTRAVOX_API_KEY", default="")
ULTRAVOX_MODEL = env_str(env, "ULTRAVOX_MODEL", default="fixie-ai/ultravox")
ULTRAVOX_VOICE = env_str(env, "ULTRAVOX_VOICE", default="Mark")
ULTRAVOX_RECORDING_ENABLED = env_bool(env, "ULTRAVOX_RECORDING_ENABLED", default=False)
ULTRAVOX_MAX_CALL_SECONDS = env_int(env, "ULTRAVOX_MAX_CALL_SECONDS", default=2700)
# Shared secret the ask_next_question custom-tool callback must present
# (X-Tool-Secret header) - Ultravox calls that endpoint with AllowAny
# permissions since it's a server-to-server webhook, not a user request.
ULTRAVOX_TOOL_SHARED_SECRET = env_str(env, "ULTRAVOX_TOOL_SHARED_SECRET", default="")
# HMAC secret used to verify account-level lifecycle webhooks
# (call.started/call.joined/call.ended). Leave blank to disable
# signature verification (dev only - never in production).
ULTRAVOX_WEBHOOK_SECRET = env_str(env, "ULTRAVOX_WEBHOOK_SECRET", default="")

EMAIL_BACKEND = env_str(env, "EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = env_str(env, "EMAIL_HOST", default="localhost")
EMAIL_PORT = env_int(env, "EMAIL_PORT", default=25)
EMAIL_HOST_USER = env_str(env, "EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env_str(env, "EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env_bool(env, "EMAIL_USE_TLS", default=False)
DEFAULT_FROM_EMAIL = env_str(env, "DEFAULT_FROM_EMAIL", default="noreply@smarthire.ai")

from infrastructure.monitoring.logging import get_logging_config
LOGGING = get_logging_config(debug=DEBUG)