import os, jwt
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()
SECRET = os.getenv("JWT_SECRET", "development-secret-change-me")
def hash_password(password: str): return password_hash.hash(password)
def verify_password(password: str, hashed: str): return password_hash.verify(password, hashed)
def create_token(user_id: int, role: str):
    return jwt.encode({"sub": str(user_id), "role": role, "exp": datetime.now(timezone.utc)+timedelta(hours=8)}, SECRET, algorithm="HS256")
def decode_token(token: str):
    try: return jwt.decode(token, SECRET, algorithms=["HS256"])
    except jwt.PyJWTError: raise HTTPException(401, "Invalid or expired token")
