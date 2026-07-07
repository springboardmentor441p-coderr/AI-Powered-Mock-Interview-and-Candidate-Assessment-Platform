"""
Sentry integration.

Call `init_sentry()` early in the Django startup sequence (e.g. in
`config/settings/production.py` after loading env vars) to enable
error monitoring.

Install: pip install sentry-sdk
"""
import logging

logger = logging.getLogger("smarthire")


def init_sentry(dsn: str, environment: str = "production", traces_sample_rate: float = 0.1) -> None:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.celery import CeleryIntegration
        from sentry_sdk.integrations.django import DjangoIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration

        sentry_sdk.init(
            dsn=dsn,
            environment=environment,
            traces_sample_rate=traces_sample_rate,
            integrations=[
                DjangoIntegration(),
                CeleryIntegration(),
                LoggingIntegration(level=logging.WARNING, event_level=logging.ERROR),
            ],
            send_default_pii=False,
        )
        logger.info("Sentry initialised for environment=%s", environment)
    except ImportError:
        logger.warning("sentry-sdk not installed; error monitoring is disabled.")
