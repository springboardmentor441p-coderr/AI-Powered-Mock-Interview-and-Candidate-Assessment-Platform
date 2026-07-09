import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartHire AI API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "smarthire_ai_secret_key_super_secure_123456!!!")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./instance/smarthire.db")
    
    # Media upload paths
    UPLOAD_DIR: str = "uploads"
    
    class Config:
        case_sensitive = True

settings = Settings()
