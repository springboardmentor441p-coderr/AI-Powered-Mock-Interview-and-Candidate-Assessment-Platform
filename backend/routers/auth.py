from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.database import get_db
from backend.models.user import User
from backend.utils.auth_utils import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "candidate"


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    name: str
    role: str


@router.post("/signup", status_code=201)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if data.role not in ["candidate", "recruiter", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    new_user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Account created successfully", "user_id": new_user.id}


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(data={
        "sub": str(user.id),
        "email": user.email,
        "role": user.role
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        name=user.name,
        role=user.role
    )