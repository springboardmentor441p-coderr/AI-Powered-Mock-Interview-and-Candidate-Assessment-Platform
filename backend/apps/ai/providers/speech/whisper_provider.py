from django.conf import settings

from apps.ai.providers.speech.interfaces import ISpeechToTextProvider, TranscriptionResult
from core.exceptions import ExternalServiceError


class WhisperSpeechToTextProvider(ISpeechToTextProvider):
    """Adapter around OpenAI's Whisper transcription API."""

    def transcribe(self, audio_file_path: str) -> TranscriptionResult:
        try:
            from openai import OpenAI
        except ImportError as exc:
            raise ExternalServiceError("The 'openai' package is not installed.") from exc

        client = OpenAI(api_key=settings.WHISPER_API_KEY or settings.OPENAI_API_KEY)
        try:
            with open(audio_file_path, "rb") as audio_file:
                response = client.audio.transcriptions.create(
                    model="whisper-1", file=audio_file, response_format="verbose_json"
                )
        except Exception as exc:  # noqa: BLE001
            raise ExternalServiceError("Speech transcription failed.", details={"reason": str(exc)}) from exc

        return TranscriptionResult(
            text=response.text,
            confidence=getattr(response, "confidence", 0.9) or 0.9,
            duration_seconds=getattr(response, "duration", 0.0) or 0.0,
            word_timestamps=[seg.__dict__ for seg in getattr(response, "segments", [])] if hasattr(response, "segments") else [],
        )
