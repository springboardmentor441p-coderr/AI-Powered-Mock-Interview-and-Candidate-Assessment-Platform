import os
# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartHire AI Engine"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "smarthire-ai-super-secret-jwt-key-2026-secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database configuration (SQLite default for quick local run, supports Postgres via ENV)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smarthire.db")

    # AI API Keys
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    ULTRAVOX_API_KEY: str = os.getenv("ULTRAVOX_API_KEY", "")

    class Config:
        case_sensitive = True

settings = Settings()
