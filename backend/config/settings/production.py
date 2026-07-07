from .base import *  # noqa: F401,F403
from .base import DATABASES, env
from core.env import env_bool

DEBUG = False
SECURE_SSL_REDIRECT = env_bool(env, "SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
X_FRAME_OPTIONS = "DENY"
DATABASES["default"]["CONN_MAX_AGE"] = 60
DATABASES["default"]["ATOMIC_REQUESTS"] = True
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
