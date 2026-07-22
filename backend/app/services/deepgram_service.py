"""
Deepgram Voice AI integration.

This module uses the Deepgram SDK 7.x generated client surface. In this
version, request options are passed directly to resource methods instead of
using the older PrerecordedOptions / SpeakOptions helper classes.
"""

import logging
from contextlib import AbstractAsyncContextManager
from pathlib import Path
from typing import Any

from deepgram.client import AsyncDeepgramClient
from deepgram.core.api_error import ApiError

from app.config import settings

logger = logging.getLogger(__name__)


class DeepgramConfigurationError(RuntimeError):
    """Raised when Deepgram cannot be used because configuration is missing."""


class DeepgramServiceError(RuntimeError):
    """Raised when a Deepgram API call fails."""


class DeepgramService:
    """
    Async wrapper around Deepgram STT, TTS, and live websocket clients.

    The service is intentionally small and transport-agnostic so a future
    FastAPI websocket can reuse connect_live while browser audio chunks are
    streamed through the returned Deepgram socket client.
    """

    def __init__(self, api_key: str | None = None) -> None:
        self.api_key = api_key or settings.DEEPGRAM_API_KEY
        if not self.api_key:
            raise DeepgramConfigurationError(
                "DEEPGRAM_API_KEY is not configured. Add it to your .env file."
            )

        # SDK 7.5.0 requires keyword arguments. Positional construction raises
        # TypeError because the generated BaseClient has a keyword-only API.
        self.client = AsyncDeepgramClient(api_key=self.api_key)

    async def speech_to_text(
        self,
        audio: bytes | str | Path,
        *,
        model: str | None = None,
        language: str | None = None,
        smart_format: bool = True,
        punctuate: bool = True,
    ) -> str:
        """
        Transcribe a complete audio file or in-memory audio bytes.

        Args:
            audio: Raw audio bytes or a path to an audio file.
            model: Optional Deepgram STT model override.
            language: Optional language override.
            smart_format: Enables dates, numbers, and punctuation formatting.
            punctuate: Enables punctuation in transcripts.

        Returns:
            The best transcript returned by Deepgram.
        """
        audio_bytes = self._read_audio(audio)
        if not audio_bytes:
            raise DeepgramServiceError("Audio payload is empty.")

        try:
            response = await self.client.listen.v1.media.transcribe_file(
                request=audio_bytes,
                model=model or settings.DEEPGRAM_STT_MODEL,
                language=language or settings.DEEPGRAM_LANGUAGE,
                smart_format=smart_format,
                punctuate=punctuate,
            )
            return self._extract_transcript(response)
        except ApiError as exc:
            logger.warning("Deepgram STT API error: %s", exc)
            raise DeepgramServiceError(self._format_api_error(exc)) from exc
        except Exception as exc:  # noqa: BLE001 - normalize SDK/network errors
            logger.exception("Unexpected Deepgram STT failure")
            raise DeepgramServiceError("Deepgram speech-to-text failed.") from exc

    async def text_to_speech(
        self,
        text: str,
        *,
        model: str | None = None,
        encoding: str = "mp3",
        container: str | None = None,
        output_path: str | Path | None = None,
    ) -> bytes:
        """
        Generate speech audio for text.

        Args:
            text: Text to synthesize.
            model: Optional Deepgram TTS model override.
            encoding: Audio encoding, defaults to mp3.
            container: Optional container for non-mp3 encodings.
            output_path: Optional path to also persist the generated audio.

        Returns:
            Audio bytes suitable for a StreamingResponse or file write.
        """
        clean_text = text.strip()
        if not clean_text:
            raise DeepgramServiceError("Text payload is empty.")

        chunks: list[bytes] = []

        try:
            audio_stream = self.client.speak.v1.audio.generate(
                text=clean_text,
                model=model or settings.DEEPGRAM_TTS_MODEL,
                encoding=encoding,
                container=container,
            )
            async for chunk in audio_stream:
                chunks.append(chunk)
        except ApiError as exc:
            logger.warning("Deepgram TTS API error: %s", exc)
            raise DeepgramServiceError(self._format_api_error(exc)) from exc
        except Exception as exc:  # noqa: BLE001 - normalize SDK/network errors
            logger.exception("Unexpected Deepgram TTS failure")
            raise DeepgramServiceError("Deepgram text-to-speech failed.") from exc

        audio_bytes = b"".join(chunks)
        if output_path is not None:
            Path(output_path).write_bytes(audio_bytes)

        return audio_bytes

    def connect_live(
        self,
        *,
        model: str | None = None,
        language: str | None = None,
        encoding: str | None = None,
        sample_rate: int | None = None,
        interim_results: bool = True,
        smart_format: bool = True,
        punctuate: bool = True,
    ) -> AbstractAsyncContextManager[Any]:
        """
        Create a live STT websocket connection context manager.

        Usage for a future FastAPI websocket:

            async with service.connect_live(...) as dg_socket:
                await dg_socket.send(audio_chunk)

        The SDK returns an async context manager, so this method returns it
        directly instead of hiding socket operations.
        """
        return self.client.listen.v1.connect(
            model=model or settings.DEEPGRAM_LIVE_MODEL,
            language=language or settings.DEEPGRAM_LANGUAGE,
            encoding=encoding,
            sample_rate=sample_rate,
            interim_results=interim_results,
            smart_format=smart_format,
            punctuate=punctuate,
        )

    @staticmethod
    def _read_audio(audio: bytes | str | Path) -> bytes:
        if isinstance(audio, bytes):
            return audio

        audio_path = Path(audio)
        if not audio_path.exists():
            raise DeepgramServiceError(f"Audio file not found: {audio_path}")

        return audio_path.read_bytes()

    @staticmethod
    def _extract_transcript(response: Any) -> str:
        channels = response.results.channels
        if not channels or not channels[0].alternatives:
            return ""

        return channels[0].alternatives[0].transcript or ""

    @staticmethod
    def _format_api_error(exc: ApiError) -> str:
        status = f"HTTP {exc.status_code}: " if exc.status_code else ""
        return f"{status}{exc.body or 'Deepgram API request failed.'}"


def get_deepgram_service() -> DeepgramService:
    """FastAPI dependency that creates the service only when a route needs it."""
    return DeepgramService()
