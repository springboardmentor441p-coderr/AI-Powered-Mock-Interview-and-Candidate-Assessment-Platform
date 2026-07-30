"""
Deepgram Voice AI integration.

This module uses the Deepgram SDK 7.x generated client surface. In this
version, request options are passed directly to resource methods instead of
using the older PrerecordedOptions / SpeakOptions helper classes.
"""

import asyncio
import logging
from contextlib import AbstractAsyncContextManager
from pathlib import Path
from typing import Any

import httpx
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

        content_type = self._detect_audio_content_type(audio_bytes)
        if settings.VOICE_STT_PROVIDER == "groq":
            if not settings.GROQ_API_KEY:
                raise DeepgramConfigurationError(
                    "VOICE_STT_PROVIDER is 'groq', but GROQ_API_KEY is not configured."
                )
            return await self._transcribe_with_groq(
                audio_bytes,
                content_type=content_type,
                language=language or settings.DEEPGRAM_LANGUAGE,
            )

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0)) as client:
                for attempt in range(3):
                    response = await client.post(
                        "https://api.deepgram.com/v1/listen",
                        params={
                            "model": model or settings.DEEPGRAM_STT_MODEL,
                            "language": language or settings.DEEPGRAM_LANGUAGE,
                            "smart_format": str(smart_format).lower(),
                            "punctuate": str(punctuate).lower(),
                        },
                        headers={
                            "Authorization": f"Token {self.api_key}",
                            "Content-Type": content_type,
                            "Content-Length": str(len(audio_bytes)),
                        },
                        content=audio_bytes,
                    )
                    if response.status_code not in {408, 429, 500, 502, 503, 504}:
                        break
                    if response.status_code == 408:
                        # SLOW_UPLOAD is a route-level failure; retrying the same
                        # body only delays the working fallback.
                        break
                    logger.warning(
                        "Transient Deepgram STT response %s on attempt %s/3",
                        response.status_code,
                        attempt + 1,
                    )
                    if attempt < 2:
                        await asyncio.sleep(0.5 * (2 ** attempt))
            if response.is_error:
                request_id = response.headers.get("dg-request-id", "unknown")
                try:
                    detail = response.json()
                except ValueError:
                    detail = response.text[:500]
                if settings.GROQ_API_KEY:
                    logger.warning(
                        "Deepgram STT failed with HTTP %s; falling back to Groq Whisper.",
                        response.status_code,
                    )
                    return await self._transcribe_with_groq(
                        audio_bytes,
                        content_type=content_type,
                        language=language or settings.DEEPGRAM_LANGUAGE,
                    )
                raise DeepgramServiceError(
                    f"Deepgram HTTP {response.status_code} "
                    f"(request {request_id}): {detail}"
                )
            return self._extract_transcript(response.json())
        except DeepgramServiceError:
            raise
        except httpx.TimeoutException as exc:
            logger.warning("Deepgram STT request timed out", exc_info=True)
            if settings.GROQ_API_KEY:
                return await self._transcribe_with_groq(
                    audio_bytes,
                    content_type=self._detect_audio_content_type(audio_bytes),
                    language=language or settings.DEEPGRAM_LANGUAGE,
                )
            raise DeepgramServiceError("Deepgram transcription timed out.") from exc
        except httpx.HTTPError as exc:
            logger.warning("Deepgram STT network error", exc_info=True)
            if settings.GROQ_API_KEY:
                return await self._transcribe_with_groq(
                    audio_bytes,
                    content_type=self._detect_audio_content_type(audio_bytes),
                    language=language or settings.DEEPGRAM_LANGUAGE,
                )
            raise DeepgramServiceError(
                f"Could not connect to Deepgram: {type(exc).__name__}: {exc}"
            ) from exc
        except Exception as exc:  # noqa: BLE001 - normalize SDK/network errors
            logger.exception("Unexpected Deepgram STT failure")
            raise DeepgramServiceError(
                f"Deepgram speech-to-text failed: {type(exc).__name__}: {exc}"
            ) from exc

    async def _transcribe_with_groq(
        self,
        audio_bytes: bytes,
        *,
        content_type: str,
        language: str,
    ) -> str:
        """Use Groq Whisper when the configured Deepgram route is unavailable."""
        extension = {
            "audio/wav": ".wav",
            "audio/mp4": ".m4a",
            "audio/ogg": ".ogg",
            "audio/webm": ".webm",
            "audio/mpeg": ".mp3",
        }.get(content_type, ".wav")
        url = settings.GROQ_BASE_URL.rstrip("/") + "/audio/transcriptions"

        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(120.0, connect=10.0)
            ) as client:
                response = await client.post(
                    url,
                    headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                    files={
                        "file": (
                            f"candidate_answer{extension}",
                            audio_bytes,
                            content_type,
                        ),
                    },
                    data={
                        "model": "whisper-large-v3-turbo",
                        "language": language,
                        "response_format": "json",
                    },
                )
            if response.is_error:
                raise DeepgramServiceError(
                    f"Fallback transcription HTTP {response.status_code}: "
                    f"{response.text[:500]}"
                )
            transcript = str(response.json().get("text") or "").strip()
            if not transcript:
                raise DeepgramServiceError(
                    "Fallback transcription returned an empty transcript."
                )
            logger.info("Groq Whisper fallback transcription succeeded.")
            return transcript
        except DeepgramServiceError:
            raise
        except Exception as exc:  # noqa: BLE001 - normalize fallback failures
            logger.exception("Groq Whisper fallback transcription failed")
            raise DeepgramServiceError(
                f"Fallback transcription failed: {type(exc).__name__}: {exc}"
            ) from exc

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
        if isinstance(response, dict):
            channels = response.get("results", {}).get("channels", [])
            alternatives = channels[0].get("alternatives", []) if channels else []
            return str(alternatives[0].get("transcript") or "") if alternatives else ""

        channels = response.results.channels
        if not channels or not channels[0].alternatives:
            return ""

        return channels[0].alternatives[0].transcript or ""

    @staticmethod
    def _detect_audio_content_type(audio: bytes) -> str:
        if audio.startswith(b"RIFF") and audio[8:12] == b"WAVE":
            return "audio/wav"
        if audio.startswith(b"OggS"):
            return "audio/ogg"
        if audio.startswith(b"\x1a\x45\xdf\xa3"):
            return "audio/webm"
        if len(audio) >= 12 and audio[4:8] == b"ftyp":
            return "audio/mp4"
        if audio.startswith((b"ID3", b"\xff\xfb", b"\xff\xf3", b"\xff\xf2")):
            return "audio/mpeg"
        return "application/octet-stream"

    @staticmethod
    def _format_api_error(exc: ApiError) -> str:
        status = f"HTTP {exc.status_code}: " if exc.status_code else ""
        return f"{status}{exc.body or 'Deepgram API request failed.'}"


def get_deepgram_service() -> DeepgramService:
    """FastAPI dependency that creates the service only when a route needs it."""
    return DeepgramService()
