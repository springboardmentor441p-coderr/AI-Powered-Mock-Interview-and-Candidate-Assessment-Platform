"""Authentication blueprint package."""
from app.auth.routes import auth_bp, init_oauth

__all__ = ["auth_bp", "init_oauth"]
