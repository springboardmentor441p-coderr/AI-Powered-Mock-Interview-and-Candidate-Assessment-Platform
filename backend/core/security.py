"""
core/security.py — JWT token creation and decoding
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Any
from jose import jwt
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM  = os.getenv("ALGORITHM", "HS256")
EXPIRE_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))


def create_access_token(subject: str | int) -> str:
    """Create a signed JWT that expires in EXPIRE_MIN minutes."""
    expire  = datetime.now(timezone.utc) + timedelta(minutes=EXPIRE_MIN)
    payload = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and verify a JWT. Raises jwt.ExpiredSignatureError if expired."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
