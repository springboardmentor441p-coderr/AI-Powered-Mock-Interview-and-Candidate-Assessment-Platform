from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.resume import ResumeListItem, ResumeUploadResponse
from app.services.resume_service import ResumeService

router = APIRouter(prefix="/resume", tags=["Resume"])


def _require_current_user(request: Request) -> int:
    """Extract authenticated user id from middleware-populated request state."""
    user = getattr(request.state, "current_user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )
    return user.id


@router.post(
    "/upload",
    response_model=ResumeUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and parse a resume (PDF or DOCX)",
)
async def upload_resume(
    request: Request,
    file: UploadFile = File(..., description="PDF or DOCX file, max 10 MB"),
    db: Session = Depends(get_db),
) -> ResumeUploadResponse:
    user_id = _require_current_user(request)
    service = ResumeService(db)
    try:
        return await service.upload_and_parse(user_id, file)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get(
    "/latest",
    response_model=ResumeUploadResponse | None,
    summary="Get the most recently uploaded resume for the current user",
)
def get_latest_resume(
    request: Request,
    db: Session = Depends(get_db),
) -> ResumeUploadResponse | None:
    user_id = _require_current_user(request)
    service = ResumeService(db)
    return service.get_latest(user_id)


@router.get(
    "/list",
    response_model=list[ResumeListItem],
    summary="List all resumes uploaded by the current user",
)
def list_resumes(
    request: Request,
    db: Session = Depends(get_db),
) -> list[ResumeListItem]:
    user_id = _require_current_user(request)
    service = ResumeService(db)
    return service.get_all(user_id)
