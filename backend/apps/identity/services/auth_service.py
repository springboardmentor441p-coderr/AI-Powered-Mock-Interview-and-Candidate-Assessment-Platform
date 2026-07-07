from django.db import transaction

from core.exceptions import ValidationError
from core.services import BaseService

from apps.identity.models import Role, User
from apps.identity.repositories.interfaces import IUserRepository


class AuthService(BaseService):
    """
    Registration and credential-management use cases. Depends only on
    `IUserRepository` (constructor-injected via `core.container`), so
    persistence can be swapped/faked without touching this class -
    Dependency Inversion in practice.
    """

    def __init__(self, user_repository: IUserRepository):
        super().__init__()
        self._users = user_repository

    @transaction.atomic
    def register(
        self,
        *,
        email: str,
        password: str,
        first_name: str = "",
        last_name: str = "",
        role: str = Role.CANDIDATE,
    ) -> User:
        if self._users.exists_with_email(email):
            raise ValidationError(
                "A user with this email already exists.", details={"email": ["Already registered."]}
            )

        user = self._users.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
        )

        if user.role == Role.CANDIDATE:
            # Candidate-specific profile creation is owned by the
            # `candidate` domain; AuthService only triggers it via its
            # public service API, never touches candidate models.
            from apps.candidate.services.profile_service import CandidateProfileService

            CandidateProfileService().create_default_profile(user=user)

        self.logger.info("Registered new user %s with role=%s", user.email, user.role)
        return user

    def change_password(self, *, user: User, old_password: str, new_password: str) -> None:
        if not user.check_password(old_password):
            raise ValidationError(
                "Current password is incorrect.", details={"old_password": ["Incorrect password."]}
            )
        user.set_password(new_password)
        self._users.save(user, update_fields=["password"])
        self.logger.info("Password changed for user %s", user.email)
