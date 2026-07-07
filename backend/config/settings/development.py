from .base import *  # noqa: F401,F403
from .base import DATABASES

DEBUG = True
DATABASES["default"]["ATOMIC_REQUESTS"] = True
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
CORS_ALLOW_ALL_ORIGINS = True
