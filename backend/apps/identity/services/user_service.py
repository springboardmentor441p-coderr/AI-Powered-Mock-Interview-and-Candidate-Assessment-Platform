from core.services import BaseService

from apps.identity.models import User
from apps.identity.repositories.interfaces import IUserRepository


class UserService(BaseService):
    """Mutations on the `User` aggregate itself (not auth/credentials)."""

    def __init__(self, user_repository: IUserRepository):
        super().__init__()
        self._users = user_repository

    def update_profile(self, *, user: User, **fields) -> User:
        allowed = {"first_name", "last_name", "phone_number"}
        changed = []
        for field, value in fields.items():
            if field in allowed:
                setattr(user, field, value)
                changed.append(field)
        if changed:
            self._users.save(user, update_fields=changed)
        return user
