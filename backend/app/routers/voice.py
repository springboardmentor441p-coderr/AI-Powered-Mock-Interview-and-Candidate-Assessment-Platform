"""
Temporary voice endpoints for validating Deepgram integration.
"""

import logging
import tempfile
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse, StreamingResponse

from app.config import settings
from app.services.deepgram_service import (
    DeepgramConfigurationError,
    DeepgramService,
    DeepgramServiceError,
    get_deepgram_service,
)
from app.services.interview_agent import InterviewAgent
from app.services.interview_state import InterviewSessionNotFound
from app.services.voice_interview_service import (
    VoiceInterviewService,
    VoiceInterviewEngineError,
    VoiceInterviewServiceError,
    VoiceInterviewValidationError,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["Voice"])
interview_agent = InterviewAgent()


def get_voice_service() -> DeepgramService:
    """Translate voice-service configuration failures into HTTP responses."""
    try:
        return get_deepgram_service()
    except DeepgramConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


def get_voice_interview_service(
    deepgram: DeepgramService = Depends(get_voice_service),
) -> VoiceInterviewService:
    """Build the orchestrator with reusable app services."""
    return VoiceInterviewService(
        deepgram=deepgram,
        interview_agent=interview_agent,
    )


def validate_audio_upload(file: UploadFile, audio_bytes: bytes) -> str:
    """Validate uploaded audio and return a safe suffix for temp storage."""
    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded audio file is empty.",
        )

    if len(audio_bytes) > settings.DEEPGRAM_MAX_AUDIO_BYTES:
        max_mb = settings.DEEPGRAM_MAX_AUDIO_BYTES / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Audio file too large. Maximum allowed size is {max_mb:.0f} MB.",
        )

    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in settings.DEEPGRAM_ALLOWED_AUDIO_EXTENSIONS:
        allowed = ", ".join(sorted(settings.DEEPGRAM_ALLOWED_AUDIO_EXTENSIONS))
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported audio format '{suffix or 'unknown'}'. "
                f"Allowed: {allowed}."
            ),
        )

    return suffix


@router.post("/test-stt")
async def test_stt(
    file: UploadFile = File(...),
    deepgram: DeepgramService = Depends(get_voice_service),
) -> dict:
    """
    Upload an audio file and return the Deepgram transcript.
    """
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded audio file is empty.",
        )

    if len(audio_bytes) > settings.DEEPGRAM_MAX_AUDIO_BYTES:
        max_mb = settings.DEEPGRAM_MAX_AUDIO_BYTES / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Audio file too large. Maximum allowed size is {max_mb:.0f} MB.",
        )

    try:
        transcript = await deepgram.speech_to_text(audio_bytes)
        return {
            "filename": file.filename,
            "content_type": file.content_type,
            "transcript": transcript,
        }
    except DeepgramConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except DeepgramServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except Exception as exc:  # noqa: BLE001 - final safety net
        logger.exception("Unexpected error during voice STT test")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error during speech-to-text test.",
        ) from exc


@router.post("/test-tts")
async def test_tts(
    text: str = Form(...),
    deepgram: DeepgramService = Depends(get_voice_service),
) -> StreamingResponse:
    """
    Submit text and receive synthesized MP3 audio from Deepgram.
    """
    try:
        audio_bytes = await deepgram.text_to_speech(text)
    except DeepgramConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except DeepgramServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except Exception as exc:  # noqa: BLE001 - final safety net
        logger.exception("Unexpected error during voice TTS test")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error during text-to-speech test.",
        ) from exc

    return StreamingResponse(
        iter([audio_bytes]),
        media_type="audio/mpeg",
        headers={"Content-Disposition": 'attachment; filename="deepgram-tts.mp3"'},
    )


@router.post("/interview")
async def voice_interview(
    request: Request,
    session_id: str = Form(...),
    file: UploadFile = File(...),
    service: VoiceInterviewService = Depends(get_voice_interview_service),
) -> dict[str, object]:
    """
    Process one spoken candidate answer and return the next spoken question.
    """
    audio_bytes = await file.read()
    suffix = validate_audio_upload(file, audio_bytes)

    temp_path: Path | None = None

    try:
        with tempfile.NamedTemporaryFile(
            suffix=suffix,
            prefix="voice_answer_",
            delete=False,
        ) as temp_file:
            temp_file.write(audio_bytes)
            temp_path = Path(temp_file.name)

        result = await service.process_audio_answer(
            session_id=session_id,
            audio_path=temp_path,
        )
        result["audio_url"] = str(
            request.url_for("get_generated_audio", filename=result["audio_file"])
        )
        return result

    except InterviewSessionNotFound as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except DeepgramServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except VoiceInterviewValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except VoiceInterviewEngineError as exc:
        detail = str(exc)
        http_status = (
            status.HTTP_409_CONFLICT
            if "already been completed" in detail.lower()
            else status.HTTP_502_BAD_GATEWAY
        )
        raise HTTPException(
            status_code=http_status,
            detail=detail,
        ) from exc
    except VoiceInterviewServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except Exception as exc:  # noqa: BLE001 - final safety net
        logger.exception("Unexpected error during voice interview")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error during voice interview.",
        ) from exc
    finally:
        if temp_path and temp_path.exists():
            try:
                temp_path.unlink()
            except OSError:
                logger.warning("Failed to delete temporary audio file: %s", temp_path)


@router.get("/audio/{filename}")
async def get_generated_audio(filename: str) -> FileResponse:
    """
    Return generated interview question audio for frontend playback.
    """
    safe_name = Path(filename).name
    if safe_name != filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid audio filename.",
        )

    audio_path = Path(settings.GENERATED_AUDIO_DIR) / safe_name
    if not audio_path.exists() or not audio_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generated audio file was not found.",
        )

    return FileResponse(
        audio_path,
        media_type="audio/mpeg",
        filename=safe_name,
    )
