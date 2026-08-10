from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.candidate_profile import CandidateProfile
from app.schemas.candidate import CandidateProfileResponse

router = APIRouter(prefix="/candidate", tags=["Candidate"])


def _require_current_user(request: Request) -> int:
    user = getattr(request.state, "current_user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )
    return user.id


@router.get(
    "/profile",
    response_model=CandidateProfileResponse,
    summary="Get candidate knowledge profile",
)
def get_candidate_profile(
    request: Request,
    db: Session = Depends(get_db),
) -> CandidateProfileResponse:
    user_id = _require_current_user(request)
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No candidate profile found. Please upload a resume first to create your profile.",
        )
    return CandidateProfileResponse.from_orm_with_json(profile)
