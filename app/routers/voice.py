"""
Temporary voice endpoints for validating Deepgram integration.
"""

import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse

from app.config import settings
from app.services.deepgram_service import (
    DeepgramConfigurationError,
    DeepgramService,
    DeepgramServiceError,
    get_deepgram_service,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["Voice"])


def get_voice_service() -> DeepgramService:
    """Translate voice-service configuration failures into HTTP responses."""
    try:
        return get_deepgram_service()
    except DeepgramConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


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
