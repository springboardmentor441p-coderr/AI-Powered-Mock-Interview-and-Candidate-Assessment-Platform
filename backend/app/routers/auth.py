import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from app.schemas.schemas import UserRegister, UserLogin, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

@router.post("/signup", response_model=Token)
def signup(user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_pwd,
        target_role=user_data.target_role,
        experience_level=user_data.experience_level
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    user_dict = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "target_role": user.target_role,
        "experience_level": user.experience_level
    }
    return {
        "access_token": f"smarthire_jwt_token_user_{user.id}",
        "token_type": "bearer",
        "user": user_dict
    }

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        # Demo friendly fallback if test credentials used
        if login_data.email == "demo@smarthire.ai" and login_data.password == "demo123":
            return {
                "access_token": "smarthire_jwt_token_demo",
                "token_type": "bearer",
                "user": {
                    "id": 1,
                    "email": "demo@smarthire.ai",
                    "full_name": "Alex Vance",
                    "target_role": "Senior Full-Stack Engineer",
                    "experience_level": "Senior Level"
                }
            }
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_dict = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "target_role": user.target_role,
        "experience_level": user.experience_level
    }
    return {
        "access_token": f"smarthire_jwt_token_user_{user.id}",
        "token_type": "bearer",
        "user": user_dict
    }
