"""Authenticated audio relay for Deepgram live transcription.

The browser sends microphone bytes only to SmartHire. This relay holds the
Deepgram credential, forwards audio to Deepgram, and returns safe transcript
events to the interview room. It deliberately does not know interview scoring
or question-generation rules.
"""

import asyncio
import json
import os
from urllib.parse import urlencode

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from websockets.asyncio.client import connect

from ..database import SessionLocal
from ..models import Interview, Role, User
from ..security import decode_token

router = APIRouter(prefix="/voice", tags=["voice transcription"])


def deepgram_url() -> str:
    parameters = {
        "model": "nova-3",
        "language": "en-IN",
        "interim_results": "true",
        "punctuate": "true",
        "smart_format": "true",
        "endpointing": "1000",
        "utterance_end_ms": "1500",
        "vad_events": "true",
    }
    return f"wss://api.deepgram.com/v1/listen?{urlencode(parameters)}"


def websocket_user(interview_id: int, token: str | None) -> User | None:
    if not token:
        return None
    try:
        claims = decode_token(token)
    except Exception:
        return None
    db = SessionLocal()
    try:
        user = db.get(User, int(claims["sub"]))
        if not user or user.role != Role.candidate:
            return None
        interview = db.scalar(
            select(Interview)
            .options(selectinload(Interview.questions))
            .where(Interview.id == interview_id, Interview.candidate_id == user.id, Interview.status == "in_progress")
        )
        return user if interview else None
    finally:
        db.close()


async def forward_browser_audio(browser: WebSocket, deepgram) -> None:
    while True:
        packet = await browser.receive()
        if packet["type"] == "websocket.disconnect":
            return
        if packet.get("bytes") is not None:
            await deepgram.send(packet["bytes"])
            continue
        text = packet.get("text")
        if not text:
            continue
        try:
            command = json.loads(text).get("type")
        except json.JSONDecodeError:
            continue
        if command == "finalize":
            await deepgram.send(json.dumps({"type": "Finalize"}))
        elif command == "keepalive":
            await deepgram.send(json.dumps({"type": "KeepAlive"}))
        elif command == "close":
            await deepgram.send(json.dumps({"type": "CloseStream"}))
            return


async def forward_deepgram_events(browser: WebSocket, deepgram) -> None:
    async for raw_event in deepgram:
        try:
            event = json.loads(raw_event)
        except (TypeError, json.JSONDecodeError):
            continue
        event_type = event.get("type")
        if event_type == "Results":
            alternative = (event.get("channel", {}).get("alternatives") or [{}])[0]
            transcript = (alternative.get("transcript") or "").strip()
            if transcript:
                start, duration = event.get("start", 0), event.get("duration", 0)
                await browser.send_json({
                    "type": "transcript",
                    "text": transcript,
                    "is_final": bool(event.get("is_final")),
                    "speech_final": bool(event.get("speech_final")),
                    "confidence": alternative.get("confidence", 0),
                    "segment_id": f"{start}:{duration}:{transcript}",
                })
        elif event_type == "SpeechStarted":
            await browser.send_json({"type": "speech_started"})
        elif event_type == "UtteranceEnd":
            await browser.send_json({"type": "utterance_end"})
        elif event_type == "Error":
            await browser.send_json({"type": "error", "message": event.get("description", "Deepgram transcription failed.")})


@router.websocket("/deepgram/{interview_id}")
async def deepgram_stream(websocket: WebSocket, interview_id: int) -> None:
    """Proxy a candidate's interview microphone stream to Deepgram."""
    user = websocket_user(interview_id, websocket.query_params.get("token"))
    if not user:
        await websocket.close(code=4401)
        return
    api_key = os.getenv("DEEPGRAM_API_KEY")
    if not api_key:
        await websocket.accept()
        await websocket.send_json({"type": "error", "message": "Voice transcription is not configured."})
        await websocket.close(code=1011)
        return

    await websocket.accept()
    try:
        async with connect(deepgram_url(), additional_headers={"Authorization": f"Token {api_key}"}, max_size=4_000_000) as deepgram:
            await websocket.send_json({"type": "ready"})
            browser_task = asyncio.create_task(forward_browser_audio(websocket, deepgram))
            deepgram_task = asyncio.create_task(forward_deepgram_events(websocket, deepgram))
            done, pending = await asyncio.wait({browser_task, deepgram_task}, return_when=asyncio.FIRST_COMPLETED)
            for task in pending:
                task.cancel()
            await asyncio.gather(*pending, return_exceptions=True)
            for task in done:
                exception = task.exception()
                if exception and not isinstance(exception, WebSocketDisconnect):
                    raise exception
    except WebSocketDisconnect:
        return
    except Exception:
        try:
            await websocket.send_json({"type": "error", "message": "Voice transcription connection was interrupted."})
        except Exception:
            pass
        await websocket.close(code=1011)
