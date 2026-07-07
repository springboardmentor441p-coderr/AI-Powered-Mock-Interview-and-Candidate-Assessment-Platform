from rest_framework.permissions import BasePermission, SAFE_METHODS


class HasRole(BasePermission):
    allowed_roles: tuple[str, ...] = ()
    message = "You do not have the required role."

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True
        return request.user.role in self.allowed_roles  # type: ignore[union-attr]


class IsCandidate(HasRole):
    allowed_roles = ("candidate",)


class IsRecruiter(HasRole):
    allowed_roles = ("recruiter",)


class IsAdminRole(HasRole):
    allowed_roles = ("admin",)


class IsRecruiterOrAdmin(HasRole):
    allowed_roles = ("recruiter", "admin")


class IsOwnerOrRecruiterOrAdmin(BasePermission):
    owner_field = "candidate"

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_superuser or user.role in ("recruiter", "admin"):
            return True
        owner = getattr(obj, self.owner_field, None)
        owner_user = getattr(owner, "user", owner)
        return owner_user == user
