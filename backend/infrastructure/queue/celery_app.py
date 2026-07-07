"""
Re-exports the Celery app from config.celery so any infrastructure
consumer can `from infrastructure.queue.celery_app import app`
without needing to know where the Celery instance lives.
"""
from config.celery import app  # noqa: F401
