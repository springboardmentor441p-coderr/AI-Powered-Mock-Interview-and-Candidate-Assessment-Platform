import secrets
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, RegisterRequest, TokenOut
from ..security import create_token, hash_password, verify_password
router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/guest", response_model=TokenOut, status_code=201)
def guest_access(db: Session = Depends(get_db)):
    """Creates an isolated, practice-only candidate session without a login screen."""
    guest_id = uuid.uuid4().hex[:10]
    user = User(
        full_name="Guest Candidate",
        email=f"guest-{guest_id}@local.smarthire",
        password_hash=hash_password(secrets.token_urlsafe(24)),
    )
    db.add(user); db.commit(); db.refresh(user)
    return {"access_token": create_token(user.id, user.role.value), "user": user}

@router.post("/register", response_model=TokenOut, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == body.email)): raise HTTPException(409, "Email is already registered")
    user = User(full_name=body.full_name, email=body.email, password_hash=hash_password(body.password), role=body.role)
    db.add(user); db.commit(); db.refresh(user)
    return {"access_token": create_token(user.id, user.role.value), "user": user}

@router.post("/login", response_model=TokenOut)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email))
    if not user or not verify_password(body.password, user.password_hash): raise HTTPException(401, "Incorrect email or password")
    return {"access_token": create_token(user.id, user.role.value), "user": user}
