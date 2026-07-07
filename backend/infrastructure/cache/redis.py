"""
Redis cache abstraction.

Provides a thin wrapper around Django's cache framework so application
services interact with a named interface rather than importing
`django.core.cache` directly - making it mockable in tests and
swappable to memcached / in-memory without touching callers.
"""
import logging
from typing import Any

from django.core.cache import cache

logger = logging.getLogger("smarthire")


class RedisCache:
    """Thin wrapper around Django's cache backend."""

    def get(self, key: str, default: Any = None) -> Any:
        return cache.get(key, default)

    def set(self, key: str, value: Any, timeout: int = 300) -> bool:
        try:
            cache.set(key, value, timeout)
            return True
        except Exception as exc:  # noqa: BLE001
            logger.warning("Cache set failed for key=%s: %s", key, exc)
            return False

    def delete(self, key: str) -> None:
        cache.delete(key)

    def get_or_set(self, key: str, callable_, timeout: int = 300) -> Any:
        return cache.get_or_set(key, callable_, timeout)
