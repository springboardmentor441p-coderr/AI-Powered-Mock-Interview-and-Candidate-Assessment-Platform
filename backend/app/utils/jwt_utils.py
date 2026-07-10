from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None
