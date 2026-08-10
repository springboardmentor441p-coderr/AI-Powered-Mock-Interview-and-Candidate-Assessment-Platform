from sqlalchemy.orm import Session

from app.repositories.user_repository import UserRepository
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse, ResetPasswordRequest
from app.utils.jwt_utils import decode_token
from app.utils.security import create_access_token, hash_password, verify_password


class AuthService:
    def __init__(self, db: Session) -> None:
        self.user_repository = UserRepository(db)

    def register(self, payload: RegisterRequest) -> AuthResponse:
        if self.user_repository.get_by_email(payload.email.lower()):
            raise ValueError("Email is already registered")
        if self.user_repository.get_by_username(payload.username):
            raise ValueError("Username is already taken")

        password_hash = hash_password(payload.password)
        user = self.user_repository.create(payload, password_hash)
        access_token = create_access_token(subject=str(user.id))
        return AuthResponse(access_token=access_token, user=UserResponse.model_validate(user))

    def login(self, payload: LoginRequest) -> AuthResponse:
        user = self.user_repository.get_by_email(payload.email.lower())
        if not user or not verify_password(payload.password, user.password_hash):
            raise ValueError("Invalid email or password")

        access_token = create_access_token(subject=str(user.id))
        return AuthResponse(access_token=access_token, user=UserResponse.model_validate(user))

    def get_user_id_from_token(self, token: str) -> int | None:
        payload = decode_token(token)
        if not payload:
            return None
        subject = payload.get("sub")
        return int(subject) if subject and str(subject).isdigit() else None

    def reset_password(self, payload: ResetPasswordRequest) -> None:
        user = self.user_repository.get_by_email(payload.email.lower())
        if not user:
            raise ValueError("Email address not found")
        password_hash = hash_password(payload.new_password)
        self.user_repository.update_password(user, password_hash)
