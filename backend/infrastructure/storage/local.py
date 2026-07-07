"""
Local filesystem storage.

Uses Django's `default_storage` which is already configured in
settings (`STORAGES`). Provides a named interface for the few places
that need to interact with storage programmatically (e.g. deleting
old resume files) without importing Django internals directly.
"""
from django.core.files.storage import default_storage


class LocalStorage:
    def save(self, name: str, content) -> str:
        return default_storage.save(name, content)

    def open(self, name: str, mode: str = "rb"):
        return default_storage.open(name, mode)

    def delete(self, name: str) -> None:
        if default_storage.exists(name):
            default_storage.delete(name)

    def exists(self, name: str) -> bool:
        return default_storage.exists(name)

    def url(self, name: str) -> str:
        return default_storage.url(name)
