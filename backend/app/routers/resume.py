"""
API routes for resume parsing.
"""

import logging
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.config import settings
from app.services.ollama_service import OllamaConnectionError, OllamaInvalidResponseError
from app.services.resume_parser import (
    UnsupportedFileTypeError,
    parse_resume,
)
from app.utils.docx_utils import DOCXExtractionError
from app.utils.pdf_utils import PDFExtractionError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/parse-resume", tags=["Resume Parser"])


def _validate_upload(file: UploadFile, file_bytes: bytes) -> None:
    """
    Validate an uploaded resume file's extension, content type, and size.

    Args:
        file: The FastAPI UploadFile object.
        file_bytes: The full file content already read into memory.

    Raises:
        HTTPException: 400 for empty files or unsupported types,
            413 for files exceeding the configured size limit.
    """
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    extension = Path(file.filename or "").suffix.lower()
    if extension not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported file type '{extension}'. "
                f"Only {', '.join(sorted(settings.ALLOWED_EXTENSIONS))} are allowed."
            ),
        )

    if file.content_type not in settings.ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported content type '{file.content_type}'. "
                "File must be a valid PDF or DOCX document."
            ),
        )

    if len(file_bytes) > settings.MAX_FILE_SIZE_BYTES:
        max_mb = settings.MAX_FILE_SIZE_BYTES / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum allowed size is {max_mb:.0f} MB.",
        )


@router.post("", summary="Parse a resume file into structured JSON")
async def parse_resume_endpoint(file: UploadFile = File(...)) -> dict:
    """
    Parse an uploaded resume (.pdf or .docx) into structured JSON using
    a local Ollama LLM.

    Args:
        file: The uploaded resume file, sent as multipart/form-data.

    Returns:
        A dict containing structured resume fields (name, email, skills,
        education, experience, projects, etc).

    Raises:
        HTTPException:
            400 - empty file, unsupported file type, or extraction failure.
            413 - file exceeds the maximum allowed size.
            502 - could not reach or get a valid response from Ollama.
            500 - unexpected internal error.
    """
    file_bytes = await file.read()

    _validate_upload(file, file_bytes)

    try:
        result = parse_resume(file.filename, file_bytes)
        return result

    except UnsupportedFileTypeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    except (PDFExtractionError, DOCXExtractionError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    except OllamaConnectionError as exc:
        logger.error("Ollama connection error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to communicate with the LLM service: {exc}",
        )

    except OllamaInvalidResponseError as exc:
        logger.error("Invalid JSON from Ollama: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse LLM response as JSON: {exc}",
        )

    except Exception as exc:  # noqa: BLE001 - final safety net
        logger.exception("Unexpected error while parsing resume")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error while parsing resume: {exc}",
        )
