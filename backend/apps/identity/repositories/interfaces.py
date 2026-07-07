from abc import ABC, abstractmethod
from typing import Optional

from apps.identity.models import User


class IUserRepository(ABC):
    @abstractmethod
    def get_by_id(self, user_id) -> Optional[User]:
        ...

    @abstractmethod
    def get_by_email(self, email: str) -> Optional[User]:
        ...

    @abstractmethod
    def exists_with_email(self, email: str) -> bool:
        ...

    @abstractmethod
    def create_user(self, *, email: str, password: str, **fields) -> User:
        ...

    @abstractmethod
    def save(self, user: User, update_fields: list[str] | None = None) -> User:
        ...
