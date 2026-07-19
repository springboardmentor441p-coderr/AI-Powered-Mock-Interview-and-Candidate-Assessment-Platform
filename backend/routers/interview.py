from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from backend.services.voice_service import text_to_speech, speech_to_text
from backend.services.question_generator import get_next_ai_response
from backend.utils.auth_utils import decode_token
import os
import uuid

router = APIRouter(prefix="/interview", tags=["Interview Session"])

AUDIO_DIR = "data/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)


class SpeakRequest(BaseModel):
    text: str


class NextResponseRequest(BaseModel):
    conversation_history: list  # [{"role": "assistant"/"user", "content": "..."}]
    remaining_questions: list


@router.post("/speak")
def speak_text(
    data: SpeakRequest,
    token_data: dict = Depends(decode_token)
):
    """Convert AI's text into speech audio and return the audio file."""
    filename = f"{uuid.uuid4()}.mp3"
    output_path = os.path.join(AUDIO_DIR, filename)

    try:
        text_to_speech(data.text, output_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")

    return FileResponse(output_path, media_type="audio/mpeg", filename=filename)


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    token_data: dict = Depends(decode_token)
):
    """Convert candidate's recorded audio into text."""
    temp_path = os.path.join(AUDIO_DIR, f"temp_{uuid.uuid4()}.webm")

    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        transcript = speech_to_text(temp_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"STT failed: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return {"transcript": transcript}


@router.post("/next-response")
def next_ai_response(
    data: NextResponseRequest,
    token_data: dict = Depends(decode_token)
):
    """Decide the AI's next message: a follow-up question or the next planned question."""
    result = get_next_ai_response(data.conversation_history, data.remaining_questions)
    return result