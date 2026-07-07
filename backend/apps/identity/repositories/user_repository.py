from typing import Optional

from core.repositories import DjangoModelRepository

from apps.identity.models import User
from apps.identity.repositories.interfaces import IUserRepository


class UserRepository(DjangoModelRepository[User], IUserRepository):
    """
    Concrete persistence gateway for `User`. Services depend on
    `IUserRepository`, never on `User.objects` directly - this is the
    only module in the codebase allowed to issue raw `User` ORM
    queries for the identity domain.
    """

    model = User

    def get_by_id(self, user_id) -> Optional[User]:  # type: ignore[override]
        return self.model.objects.filter(pk=user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.model.objects.filter(email__iexact=email).first()

    def exists_with_email(self, email: str) -> bool:
        return self.model.objects.filter(email__iexact=email).exists()

    def create_user(self, *, email: str, password: str, **fields) -> User:
        return self.model.objects.create_user(email=email, password=password, **fields)  # type: ignore[union-attr]

    def save(self, user: User, update_fields: list[str] | None = None) -> User:
        user.save(update_fields=update_fields)
        return user
