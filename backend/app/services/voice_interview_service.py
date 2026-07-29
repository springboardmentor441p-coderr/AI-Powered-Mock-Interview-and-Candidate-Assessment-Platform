"""
Voice interview orchestration.

This service connects the existing Deepgram service with the existing
InterviewAgent without duplicating either service's responsibilities.
"""

from __future__ import annotations

import logging
import re
from pathlib import Path
from uuid import uuid4

from starlette.concurrency import run_in_threadpool

from app.config import settings
from app.services.deepgram_service import DeepgramService
from app.services.interview_agent import InterviewAgent
from app.services.interview_state import InterviewSessionNotFound

logger = logging.getLogger(__name__)


class VoiceInterviewServiceError(RuntimeError):
    """Raised when the voice interview orchestration fails."""


class VoiceInterviewValidationError(VoiceInterviewServiceError):
    """Raised when a voice interview request cannot be processed as submitted."""


class VoiceInterviewEngineError(VoiceInterviewServiceError):
    """Raised when the existing interview engine cannot process the answer."""


class VoiceInterviewService:
    """Coordinates STT, interview answer submission, TTS, and audio storage."""

    def __init__(
        self,
        *,
        deepgram: DeepgramService,
        interview_agent: InterviewAgent,
        generated_audio_dir: str | Path | None = None,
    ) -> None:
        self.deepgram = deepgram
        self.interview_agent = interview_agent
        self.generated_audio_dir = Path(
            generated_audio_dir or settings.GENERATED_AUDIO_DIR
        )

    async def process_audio_answer(
        self,
        *,
        session_id: str,
        audio_path: str | Path,
    ) -> dict[str, object]:
        """
        Convert candidate audio into an interview answer and spoken next question.
        """
        cleaned_session_id = session_id.strip()
        if not cleaned_session_id:
            raise VoiceInterviewValidationError("session_id is required.")

        transcript = (await self.deepgram.speech_to_text(audio_path)).strip()
        if not transcript:
            raise VoiceInterviewValidationError(
                "Deepgram did not return a transcript for this audio."
            )

        try:
            # InterviewAgent is currently synchronous and may call Groq, so run
            # it off the event loop while keeping the existing API unchanged.
            interview_result = await run_in_threadpool(
                self.interview_agent.submit_answer,
                session_id=cleaned_session_id,
                answer=transcript,
            )
        except InterviewSessionNotFound:
            raise
        except ValueError as exc:
            raise VoiceInterviewEngineError(str(exc)) from exc
        except Exception as exc:  # noqa: BLE001 - hide LLM/internal details
            logger.exception("Interview agent failed during voice interview")
            raise VoiceInterviewEngineError(
                "The interview engine could not process this answer."
            ) from exc

        next_question = str(interview_result.get("question") or "").strip()
        if not next_question:
            raise VoiceInterviewEngineError(
                "The interview engine did not return a next question."
            )

        audio_filename = self._build_audio_filename(
            session_id=cleaned_session_id,
            question_number=int(interview_result.get("question_number") or 0),
        )
        audio_path = self.generated_audio_dir / audio_filename

        self.generated_audio_dir.mkdir(parents=True, exist_ok=True)
        await self.deepgram.text_to_speech(
            next_question,
            output_path=audio_path,
        )

        return {
            "session_id": interview_result.get("session_id", cleaned_session_id),
            "candidate_transcript": transcript,
            "next_question": next_question,
            "question": next_question,
            "question_number": interview_result.get("question_number"),
            "current_stage": interview_result.get("current_stage"),
            "current_topic": interview_result.get("current_topic"),
            "completed": interview_result.get("completed", False),
            "remaining_time": interview_result.get("remaining_time"),
            "interview_progress": interview_result.get("interview_progress"),
            "difficulty": interview_result.get("difficulty"),
            "interview_status": interview_result.get("interview_status"),
            "report": interview_result.get("report"),
            "audio_file": audio_filename,
            "audio_path": str(audio_path),
            "audio_url": f"/voice/audio/{audio_filename}",
        }

    @staticmethod
    def _build_audio_filename(*, session_id: str, question_number: int) -> str:
        safe_session_id = re.sub(r"[^a-zA-Z0-9_-]", "_", session_id)[:64]
        return f"{safe_session_id}_question_{question_number}_{uuid4().hex}.mp3"
