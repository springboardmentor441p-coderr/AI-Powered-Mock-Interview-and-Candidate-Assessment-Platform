"""
routers/auth.py — Real authentication with DB + password hashing + JWT

Endpoints:
  POST /auth/register  — create new user
  POST /auth/login     — returns JWT access token
  GET  /auth/me        — returns current user (requires token)
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pymongo.database import Database
from bson import ObjectId
from pydantic import BaseModel, EmailStr


from backend.database import get_db
from backend.models.user import User
from backend.core.security import create_access_token, decode_access_token

router = APIRouter()
import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── Schemas ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str = ""
    role: str = "candidate"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ── Helpers ──────────────────────────────────────────────────────────────────

def get_current_user(token: str = Depends(oauth2_scheme), db: Database = Depends(get_db)) -> User:
    """FastAPI dependency — decode JWT and return the User object."""
    try:
        payload = decode_access_token(token)
        user_id = payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    try:
        user_data = db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user ID format")
        
    if not user_data:
        raise HTTPException(status_code=401, detail="User not found")
    return User.from_mongo(user_data)


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Database = Depends(get_db)):
    """Register a new user and return JWT token immediately."""
    existing = db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email           = payload.email,
        hashed_password = hash_password(payload.password),
        full_name       = payload.full_name,
        role            = payload.role,
    )
    # Insert without `_id` so Mongo auto-generates it
    user_dict = user.model_dump(by_alias=True)
    if "_id" in user_dict and not user_dict["_id"]:
        del user_dict["_id"]
        
    result = db.users.insert_one(user_dict)
    user.id = str(result.inserted_id)

    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer", "user": user.to_dict()}


@router.post("/login", response_model=TokenResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Database = Depends(get_db)):
    """Standard OAuth2 login — returns JWT token."""
    user_data = db.users.find_one({"email": form.username})
    if not user_data:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    user = User.from_mongo(user_data)
    if not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer", "user": user.to_dict()}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently logged-in user's profile."""
    return current_user.to_dict()


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Database = Depends(get_db)):
    import random
    code = "".join(random.choices("0123456789", k=6))
    
    # Store or update verification code
    db.verification_codes.update_one(
        {"email": payload.email},
        {"$set": {"code": code, "created_at": datetime.utcnow()}},
        upsert=True
    )
    
    # Print to console
    print(f"\n==========================================")
    print(f"[FORGOT PASSWORD] Code for {payload.email}: {code}")
    print(f"==========================================\n")
    
    return {"message": "Verification code generated", "code_dev": code}


@router.post("/verify-code", response_model=TokenResponse)
def verify_code(payload: VerifyCodeRequest, db: Database = Depends(get_db)):
    record = db.verification_codes.find_one({"email": payload.email})
    if not record or record["code"] != payload.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    # Delete code after use
    db.verification_codes.delete_one({"email": payload.email})
    
    user_data = db.users.find_one({"email": payload.email})
    if not user_data:
        # Auto-create user account if not registered yet
        full_name = payload.email.split("@")[0].capitalize()
        user = User(
            email           = payload.email,
            hashed_password = hash_password("default123"),
            full_name       = full_name,
            role            = "candidate",
        )
        user_dict = user.model_dump(by_alias=True)
        if "_id" in user_dict and not user_dict["_id"]:
            del user_dict["_id"]
        result = db.users.insert_one(user_dict)
        user.id = str(result.inserted_id)
    else:
        user = User.from_mongo(user_data)
        
    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer", "user": user.to_dict()}
