"""
Authentication service layer.
"""
from datetime import datetime
from typing import Optional, Tuple

from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token

from app.extensions import db
from app.models import Admin, Recruiter, Role, SystemLog, User
from app.utils.constants import ROLE_ADMIN, ROLE_CANDIDATE, ROLE_RECRUITER


class AuthService:
    """Handles user authentication operations."""

    @staticmethod
    def get_role_by_name(role_name: str) -> Optional[Role]:
        """
        Fetch role by name.

        Args:
            role_name: Role identifier string.

        Returns:
            Role object or None.
        """
        return Role.query.filter_by(name=role_name).first()

    @staticmethod
    def register_user(
        email: str,
        username: str,
        password: str,
        full_name: str,
        role_name: str,
    ) -> Tuple[Optional[User], Optional[str]]:
        """
        Register a new user account.

        Args:
            email: User email address.
            username: Unique username.
            password: Plain text password.
            full_name: Display name.
            role_name: Role to assign.

        Returns:
            Tuple of (User, error_message).
        """
        if role_name == ROLE_ADMIN:
            return None, "Admin registration is not allowed."

        role = AuthService.get_role_by_name(role_name)
        if not role:
            return None, f"Invalid role: {role_name}"

        if User.query.filter_by(email=email.lower()).first():
            return None, "Email already registered."

        if User.query.filter_by(username=username).first():
            return None, "Username already taken."

        user = User(
            email=email.lower(),
            username=username,
            full_name=full_name,
            role_id=role.id,
            is_verified=True,
        )
        user.set_password(password)

        db.session.add(user)
        db.session.flush()

        if role_name == ROLE_RECRUITER:
            db.session.add(Recruiter(user_id=user.id))
        elif role_name == ROLE_CANDIDATE:
            pass

        AuthService.log_action(user.id, "user_registered", f"Role: {role_name}")
        db.session.commit()
        return user, None

    @staticmethod
    def authenticate(login_id: str, password: str) -> Tuple[Optional[User], Optional[str]]:
        """
        Authenticate user with email or username and password.

        Args:
            login_id: User email or username.
            password: Plain text password.

        Returns:
            Tuple of (User, error_message).
        """
        login_value = login_id.strip()
        user = User.query.filter(
            (User.email == login_value.lower())
            | (User.username == login_value)
        ).first()
        if not user:
            return None, "Invalid email or password."

        if not user.is_active:
            return None, "Account is deactivated. Contact admin."

        if not user.check_password(password):
            return None, "Invalid email or password."

        user.last_login = datetime.utcnow()
        AuthService.log_action(user.id, "user_login", "Email/password login")
        db.session.commit()
        return user, None

    @staticmethod
    def create_tokens(user: User) -> dict:
        """
        Create JWT access and refresh tokens.

        Args:
            user: Authenticated user.

        Returns:
            Dictionary with token strings.
        """
        identity = {
            "id": user.id,
            "email": user.email,
            "role": user.role.name if user.role else None,
        }
        return {
            "access_token": create_access_token(identity=identity),
            "refresh_token": create_refresh_token(identity=identity),
        }

    @staticmethod
    def find_or_create_google_user(
        google_id: str,
        email: str,
        full_name: str,
        profile_image: Optional[str] = None,
        role_name: str = ROLE_CANDIDATE,
    ) -> User:
        """
        Find existing or create new user from Google OAuth.

        Args:
            google_id: Google account ID.
            email: Google email.
            full_name: Display name from Google.
            profile_image: Profile image URL.
            role_name: Default role for new users.

        Returns:
            User object.
        """
        user = User.query.filter(
            (User.google_id == google_id) | (User.email == email.lower())
        ).first()

        if user:
            user.google_id = google_id
            user.full_name = full_name or user.full_name
            user.profile_image = profile_image or user.profile_image
            user.last_login = datetime.utcnow()
            AuthService.log_action(user.id, "google_login", "Google OAuth login")
            db.session.commit()
            return user

        role = AuthService.get_role_by_name(role_name)
        if not role:
            role = AuthService.get_role_by_name(ROLE_CANDIDATE)

        user = User(
            email=email.lower(),
            username=email.split("@")[0] + "_" + google_id[:6],
            full_name=full_name,
            google_id=google_id,
            profile_image=profile_image,
            role_id=role.id,
            is_verified=True,
        )
        db.session.add(user)
        db.session.flush()

        if role.name == ROLE_RECRUITER:
            db.session.add(Recruiter(user_id=user.id))

        AuthService.log_action(user.id, "google_register", "New Google OAuth user")
        db.session.commit()
        return user

    @staticmethod
    def log_action(
        user_id: Optional[int],
        action: str,
        details: str = "",
        ip_address: str = "",
    ) -> None:
        """
        Record system log entry.

        Args:
            user_id: Associated user ID.
            action: Action identifier.
            details: Additional details.
            ip_address: Client IP address.
        """
        log = SystemLog(
            user_id=user_id,
            action=action,
            details=details,
            ip_address=ip_address,
        )
        db.session.add(log)

    @staticmethod
    def seed_roles() -> None:
        """Create default roles if they do not exist."""
        for role_name in [ROLE_ADMIN, ROLE_RECRUITER, ROLE_CANDIDATE]:
            if not Role.query.filter_by(name=role_name).first():
                db.session.add(
                    Role(
                        name=role_name,
                        description=f"{role_name.title()} role",
                    )
                )
        db.session.commit()

    @staticmethod
    def seed_admin() -> None:
        """Create default admin user if none exists."""
        admin_role = AuthService.get_role_by_name(ROLE_ADMIN)
        if not admin_role:
            return

        if User.query.join(Role).filter(Role.name == ROLE_ADMIN).first():
            return

        admin_email = current_app.config.get("ADMIN_EMAIL", "admin@smarthire.ai")
        admin_password = current_app.config.get("ADMIN_PASSWORD", "Admin@123")

        user = User(
            email=admin_email,
            username="admin",
            full_name="System Administrator",
            role_id=admin_role.id,
            is_verified=True,
        )
        user.set_password(admin_password)
        db.session.add(user)
        db.session.flush()
        db.session.add(Admin(user_id=user.id, department="IT"))
        db.session.commit()
