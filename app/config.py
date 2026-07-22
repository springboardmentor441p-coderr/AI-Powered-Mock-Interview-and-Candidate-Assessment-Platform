"""
Application configuration for InterviewIQ.
Supports SQLite (development) and MySQL (production) via DATABASE_URL.
"""
import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INSTANCE_DIR = os.path.join(BASE_DIR, "instance")
DEFAULT_SQLITE_PATH = os.path.join(INSTANCE_DIR, "smarthire.db")
DEFAULT_UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")


class Config:
    """Base configuration."""

    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-me")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "jwt-secret-key-change-me")
    JWT_ACCESS_TOKEN_EXPIRES: timedelta = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES: timedelta = timedelta(days=30)

    SQLALCHEMY_DATABASE_URI: str = os.getenv(
        "DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    SQLALCHEMY_ENGINE_OPTIONS: dict = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

    MAX_CONTENT_LENGTH: int = int(os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024))
    UPLOAD_FOLDER: str = os.getenv("UPLOAD_FOLDER", DEFAULT_UPLOAD_FOLDER)
    ALLOWED_EXTENSIONS: set = {"pdf", "webm", "wav", "mp3", "mp4", "ogg"}

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv(
        "GOOGLE_REDIRECT_URI", "http://localhost:5000/auth/google/callback"
    )

    @staticmethod
    def is_google_oauth_configured() -> bool:
        """Return True when real Google OAuth credentials are provided."""
        client_id = os.getenv("GOOGLE_CLIENT_ID", "")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
        placeholders = {"", "your-google-client-id", "your-google-client-secret"}
        return client_id not in placeholders and client_secret not in placeholders

    APP_NAME: str = os.getenv("APP_NAME", "InterviewIQ")
    APP_URL: str = os.getenv("APP_URL", "http://localhost:5000")

    WTF_CSRF_ENABLED: bool = True
    SESSION_COOKIE_SECURE: bool = False
    SESSION_COOKIE_HTTPONLY: bool = True
    REMEMBER_COOKIE_DURATION: timedelta = timedelta(days=7)


class DevelopmentConfig(Config):
    """Development configuration."""

    DEBUG: bool = True


class ProductionConfig(Config):
    """Production configuration."""

    DEBUG: bool = False
    SESSION_COOKIE_SECURE: bool = True


config_by_name: dict = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
