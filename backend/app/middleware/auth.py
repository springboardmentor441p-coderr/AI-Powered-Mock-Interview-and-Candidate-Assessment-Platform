from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.database.session import SessionLocal
from app.repositories.user_repository import UserRepository
from app.utils.jwt_utils import decode_token


class JWTAuthenticationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request.state.current_user = None
        authorization = request.headers.get("Authorization", "")
        if authorization.startswith("Bearer "):
            token = authorization.removeprefix("Bearer ").strip()
            payload = decode_token(token)
            if payload:
                subject = payload.get("sub")
                if subject and str(subject).isdigit():
                    db = SessionLocal()
                    try:
                        user = UserRepository(db).get_by_id(int(subject))
                        request.state.current_user = user
                    finally:
                        db.close()
        return await call_next(request)
