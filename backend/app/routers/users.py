from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/users", tags=["users"])

@router.post("/signup", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )
    
    # Create user
    hashed_pwd = auth.get_password_hash(user_in.password)
    new_user = models.User(
        email=user_in.email,
        password_hash=hashed_pwd,
        full_name=user_in.full_name,
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize empty profile for candidate
    if new_user.role == "candidate":
        new_profile = models.Profile(
            user_id=new_user.id,
            parsed_skills=[],
            parsed_experience=[],
            education=[],
            summary=""
        )
        db.add(new_profile)
        db.commit()

    return new_user

@router.post("/login", response_model=schemas.Token)
def login(login_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_in.email).first()
    if not user or not auth.verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate token
    token_data = {"sub": user.email, "role": user.role}
    access_token = auth.create_access_token(data=token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "email": user.email,
        "full_name": user.full_name
    }

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.get("/profile", response_model=schemas.ProfileResponse)
def get_profile(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not profile:
        # Create profile on the fly if missing
        profile = models.Profile(
            user_id=current_user.id,
            parsed_skills=[],
            parsed_experience=[],
            education=[],
            summary=""
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/profile", response_model=schemas.ProfileResponse)
def update_profile(
    profile_in: schemas.ProfileUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Update fields
    if profile_in.parsed_skills is not None:
        profile.parsed_skills = profile_in.parsed_skills
    if profile_in.parsed_experience is not None:
        profile.parsed_experience = profile_in.parsed_experience
    if profile_in.education is not None:
        profile.education = profile_in.education
    if profile_in.summary is not None:
        profile.summary = profile_in.summary
        
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/candidates", response_model=list[schemas.UserResponse])
def get_candidates(
    current_user: models.User = Depends(auth.check_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Get all candidates (for recruiter searches).
    """
    return db.query(models.User).filter(models.User.role == "candidate").all()

@router.get("/candidate/{candidate_id}/profile", response_model=schemas.ProfileResponse)
def get_candidate_profile(
    candidate_id: int,
    current_user: models.User = Depends(auth.check_role(["recruiter", "admin"])),
    db: Session = Depends(get_db)
):
    """
    Recruiter inspects a candidate's profile.
    """
    profile = db.query(models.Profile).filter(models.Profile.user_id == candidate_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    return profile
