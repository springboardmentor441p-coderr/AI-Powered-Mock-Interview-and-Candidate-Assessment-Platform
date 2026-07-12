"""
One-time (idempotent) setup step for realtime voice providers that have an
account-level webhook concept (e.g. Ultravox's call.started/joined/ended/
billed webhook - see `apps/ai/providers/realtime_voice/ultravox_provider.py`).

This is deliberately NOT triggered automatically from application code:
registering/rotating an account-wide webhook is an infrastructure action
(run once per environment, or again after BACKEND_PUBLIC_URL changes), not
something that should happen implicitly on every request or deploy.

Usage:
    python manage.py setup_realtime_webhook

For providers without this concept (Mock, or a future vendor that only
uses per-call callbacks), `ensure_account_webhook_registered` is a no-op
(see `IRealtimeVoiceProvider`), so this command is always safe to run.
"""
from django.conf import settings
from django.core.management.base import BaseCommand

from core.container import container

_LIFECYCLE_EVENTS = ["call.started", "call.joined", "call.ended", "call.billed"]


class Command(BaseCommand):
    help = "Idempotently registers the active realtime voice provider's account-level lifecycle webhook."

    def handle(self, *args, **options):
        base_url = settings.BACKEND_PUBLIC_URL.rstrip("/")
        webhook_url = f"{base_url}/api/interview/realtime/webhooks/ultravox/"

        provider = container.ai_factory().realtime_voice()
        self.stdout.write(f"Registering account webhook for {type(provider).__name__} -> {webhook_url}")

        provider.ensure_account_webhook_registered(webhook_url=webhook_url, events=_LIFECYCLE_EVENTS)

        self.stdout.write(self.style.SUCCESS("Done. Check the logs above for a generated secret, if any."))
