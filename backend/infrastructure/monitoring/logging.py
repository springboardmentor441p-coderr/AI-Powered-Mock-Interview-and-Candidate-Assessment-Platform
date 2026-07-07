"""
Structured logging configuration.

Returns a `LOGGING` dict ready to assign to `settings.LOGGING`.
Centralising this here means base.py imports the dict rather than
embedding 50 lines of logging config inline.
"""


def get_logging_config(debug: bool = False) -> dict:
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "verbose": {
                "format": "[{asctime}] {levelname} [{name}:{lineno}] {message}",
                "style": "{",
            },
            "simple": {"format": "{levelname} {message}", "style": "{"},
        },
        "filters": {
            "require_debug_true": {"()": "django.utils.log.RequireDebugTrue"},
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "verbose",
            },
        },
        "root": {"handlers": ["console"], "level": "DEBUG" if debug else "INFO"},
        "loggers": {
            "django": {"handlers": ["console"], "level": "INFO", "propagate": False},
            "django.db.backends": {
                "handlers": ["console"],
                "level": "DEBUG" if debug else "WARNING",
                "propagate": False,
            },
            "smarthire": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
            "celery": {"handlers": ["console"], "level": "INFO", "propagate": False},
        },
    }
