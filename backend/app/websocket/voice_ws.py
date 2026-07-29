"""
Realtime voice interview websocket.

Browser clients stream small audio chunks over this websocket. The browser is
responsible for end-of-utterance detection using microphone energy/silence and
sends an explicit ``end_utterance`` control message. The backend then
transcribes the completed utterance, advances the interview engine, generates
spoken AI audio, and returns the next interviewer turn.
"""

from __future__ import annotations

import logging
import json
import tempfile
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from starlette.concurrency import run_in_threadpool

from app.config import settings
from app.services.deepgram_service import (
    DeepgramConfigurationError,
    DeepgramService,
    DeepgramServiceError,
)
from app.services.interview_agent import InterviewAgent
from app.services.interview_state import InterviewSessionNotFound
from app.services.voice_interview_service import VoiceInterviewService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Realtime Voice"])
interview_agent = InterviewAgent()

MIME_SUFFIX_MAP = {
    "audio/webm": ".webm",
    "audio/ogg": ".ogg",
    "audio/mp4": ".m4a",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
}


def _audio_url(websocket: WebSocket, filename: str) -> str:
    scheme = "https" if websocket.url.scheme == "wss" else "http"
    return f"{scheme}://{websocket.url.netloc}/voice/audio/{filename}"


async def _send_error(websocket: WebSocket, message: str, code: str = "voice_error") -> None:
    await websocket.send_json({
        "type": "error",
        "code": code,
        "message": message,
    })


@router.websocket("/voice/stream/{session_id}")
async def voice_stream(websocket: WebSocket, session_id: str) -> None:
    """
    Stream candidate audio and return AI interview turns over one websocket.
    """
    await websocket.accept()

    try:
        interview_agent.state.get_session(session_id)
        deepgram = DeepgramService()
    except InterviewSessionNotFound:
        await _send_error(websocket, "Interview session was not found.", "session_expired")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    except DeepgramConfigurationError as exc:
        await _send_error(websocket, str(exc), "voice_not_configured")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        return

    service = VoiceInterviewService(
        deepgram=deepgram,
        interview_agent=interview_agent,
    )

    utterance_chunks: list[bytes] = []
    utterance_started = False
    mime_type = "audio/webm"

    await websocket.send_json({
        "type": "ready",
        "session_id": session_id,
        "message": "Realtime voice interview connected.",
    })

    try:
        while True:
            event = await websocket.receive()

            if event.get("type") == "websocket.disconnect":
                break

            if "bytes" in event and event["bytes"] is not None:
                if utterance_started:
                    utterance_chunks.append(event["bytes"])
                continue

            if "text" not in event or event["text"] is None:
                continue

            try:
                data = json.loads(event["text"])
            except json.JSONDecodeError:
                await _send_error(websocket, "Invalid websocket control message.", "bad_message")
                continue

            event_type = data.get("type")

            if event_type == "start_utterance":
                utterance_started = True
                utterance_chunks = []
                mime_type = data.get("mime_type") or "audio/webm"
                await websocket.send_json({
                    "type": "listening",
                    "message": "Listening for your answer.",
                })
                continue

            if event_type == "cancel_utterance":
                utterance_started = False
                utterance_chunks = []
                await websocket.send_json({
                    "type": "cancelled",
                    "message": "Current utterance cancelled.",
                })
                continue

            if event_type != "end_utterance":
                await _send_error(websocket, f"Unsupported event type: {event_type}", "bad_message")
                continue

            utterance_started = False
            if not utterance_chunks:
                await _send_error(websocket, "No audio was received for this answer.", "empty_audio")
                continue

            audio_bytes = b"".join(utterance_chunks)
            utterance_chunks = []

            if len(audio_bytes) > settings.DEEPGRAM_MAX_AUDIO_BYTES:
                await _send_error(websocket, "Audio answer is too large.", "audio_too_large")
                continue

            suffix = MIME_SUFFIX_MAP.get(mime_type.split(";")[0], ".webm")
            temp_path: Path | None = None

            try:
                await websocket.send_json({
                    "type": "processing",
                    "message": "Processing your answer.",
                })

                with tempfile.NamedTemporaryFile(
                    suffix=suffix,
                    prefix=f"stream_answer_{uuid4().hex}_",
                    delete=False,
                ) as temp_file:
                    temp_file.write(audio_bytes)
                    temp_path = Path(temp_file.name)

                result = await service.process_audio_answer(
                    session_id=session_id,
                    audio_path=temp_path,
                )
                result["audio_url"] = _audio_url(websocket, result["audio_file"])
                result["type"] = "interviewer_turn"

                await websocket.send_json(result)

            except InterviewSessionNotFound:
                await _send_error(websocket, "Interview session expired.", "session_expired")
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
            except DeepgramServiceError as exc:
                logger.exception("Deepgram failure during realtime voice interview")
                await _send_error(websocket, str(exc), "deepgram_error")
            except Exception as exc:  # noqa: BLE001 - isolate websocket loop
                logger.exception("Realtime voice interview turn failed")
                await _send_error(websocket, str(exc), "turn_failed")
            finally:
                if temp_path and temp_path.exists():
                    try:
                        await run_in_threadpool(temp_path.unlink)
                    except OSError:
                        logger.warning("Failed to delete temporary streamed audio: %s", temp_path)

    except WebSocketDisconnect:
        logger.info("Realtime voice websocket disconnected for session %s", session_id)
