"""
Selectors are the read-side counterpart to services: plain functions
(or thin classes) that answer questions about the domain without
mutating it. Keeping them separate from `services/` makes the
write/read (CQRS-ish) boundary explicit and lets read paths be
optimized (select_related, caching) independently of write logic.
"""
from core.exceptions import NotFoundError

from apps.identity.models import User


def get_user_or_404(user_id) -> User:
    user = User.objects.filter(pk=user_id).first()
    if user is None:
        raise NotFoundError(f"User with id={user_id} was not found.")
    return user


def get_active_candidates():
    return User.objects.filter(role=User.Role.CANDIDATE, is_active=True)
