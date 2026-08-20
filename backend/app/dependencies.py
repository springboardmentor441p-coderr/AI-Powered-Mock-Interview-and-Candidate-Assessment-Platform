from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from .database import get_db
from .models import Role, User
from .security import decode_token

bearer = HTTPBearer()
def current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)):
    data = decode_token(credentials.credentials); user = db.get(User, int(data["sub"]))
    if not user: raise HTTPException(401, "User not found")
    return user
def require_roles(*roles: Role):
    def guard(user: User = Depends(current_user)):
        if user.role not in roles: raise HTTPException(403, "Insufficient permissions")
        return user
    return guard
