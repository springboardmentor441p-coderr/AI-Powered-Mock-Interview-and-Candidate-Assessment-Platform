"""
Authentication decorators and route guards.
"""
from functools import wraps
from typing import Callable

from flask import abort, flash, redirect, request, url_for
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from flask_login import current_user

from app.utils.constants import ROLE_ADMIN, ROLE_CANDIDATE, ROLE_RECRUITER


def login_required_web(f: Callable) -> Callable:
    """
    Require authenticated user for web routes.

    Args:
        f: Route function.

    Returns:
        Decorated function.
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated:
            flash("Please log in to access this page.", "warning")
            return redirect(url_for("auth.login", next=request.url))
        return f(*args, **kwargs)

    return decorated


def role_required(*roles: str) -> Callable:
    """
    Require specific role(s) for web routes.

    Args:
        roles: Allowed role names.

    Returns:
        Decorator function.
    """

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated(*args, **kwargs):
            if not current_user.is_authenticated:
                flash("Please log in to access this page.", "warning")
                return redirect(url_for("auth.login"))
            if current_user.role.name not in roles:
                flash("You do not have permission to access this page.", "danger")
                abort(403)
            return f(*args, **kwargs)

        return decorated

    return decorator


def admin_required(f: Callable) -> Callable:
    """Require admin role."""
    return role_required(ROLE_ADMIN)(f)


def recruiter_required(f: Callable) -> Callable:
    """Require recruiter role."""
    return role_required(ROLE_RECRUITER)(f)


def candidate_required(f: Callable) -> Callable:
    """Require candidate role."""
    return role_required(ROLE_CANDIDATE)(f)


def jwt_role_required(*roles: str) -> Callable:
    """
    Require JWT authentication with specific role for API routes.

    Args:
        roles: Allowed role names.

    Returns:
        Decorator function.
    """

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated(*args, **kwargs):
            verify_jwt_in_request()
            identity = get_jwt_identity()
            if not identity or identity.get("role") not in roles:
                abort(403, description="Insufficient permissions")
            return f(*args, **kwargs)

        return decorated

    return decorator
