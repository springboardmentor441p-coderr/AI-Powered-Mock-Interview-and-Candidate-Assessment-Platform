from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..dependencies import current_user, require_roles
from ..models import Role, User
from ..schemas import RoleUpdate, UserOut
router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)): return user

@router.patch("/{user_id}/role", response_model=UserOut)
def update_role(user_id: int, body: RoleUpdate, db: Session = Depends(get_db), _: User = Depends(require_roles(Role.admin))):
    user = db.get(User, user_id)
    if not user: raise HTTPException(404, "User not found")
    user.role = body.role; db.commit(); db.refresh(user); return user
