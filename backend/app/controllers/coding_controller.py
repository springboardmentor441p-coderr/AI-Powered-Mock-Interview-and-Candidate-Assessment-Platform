from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.session import get_db
from app.schemas.coding import CodingChallengeResponse, SubmitCodeRequest, CodingSubmissionResponse
from app.services.coding_service import CodingService

router = APIRouter(prefix="/coding", tags=["Coding Assessment"])


def _require_current_user(request: Request) -> int:
    user = getattr(request.state, "current_user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )
    return user.id


@router.get(
    "/challenges",
    response_model=List[CodingChallengeResponse],
    summary="List all coding challenges, optionally filtered by language or domain",
)
def get_challenges(
    request: Request,
    language: Optional[str] = None,
    domain: Optional[str] = None,
    db: Session = Depends(get_db),
) -> List[CodingChallengeResponse]:
    _require_current_user(request)
    service = CodingService(db)
    return service.list_challenges(language=language, domain=domain)


@router.post(
    "/submit",
    response_model=CodingSubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a programming solution for evaluation",
)
async def submit_code(
    request: Request,
    payload: SubmitCodeRequest,
    db: Session = Depends(get_db),
) -> CodingSubmissionResponse:
    user_id = _require_current_user(request)
    service = CodingService(db)
    try:
        submission = await service.submit_solution(
            user_id=user_id,
            challenge_id=payload.challenge_id,
            code=payload.code,
            language=payload.language
        )
        return submission
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
