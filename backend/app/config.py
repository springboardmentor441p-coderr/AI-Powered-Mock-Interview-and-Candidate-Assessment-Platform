"""
Application configuration.

All configurable values are read from environment variables so that
nothing is hardcoded. A `.env` file can be used locally together with
`python-dotenv` (already wired up below) or values can be exported in
the shell / container environment.
"""

import os
from dotenv import load_dotenv

# Load variables from a .env file if present. Safe to call even if the
# file doesn't exist - it will simply be a no-op.
load_dotenv()


class Settings:
    """Central place for all environment-driven configuration."""

    # Max upload size in bytes (10 MB default, matches requirement #2)
    MAX_FILE_SIZE_BYTES: int = int(os.getenv("MAX_FILE_SIZE_MB", "10")) * 1024 * 1024

    # Allowed file extensions / content types
    ALLOWED_EXTENSIONS = {".pdf", ".docx"}
    ALLOWED_CONTENT_TYPES = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }

    GROQ_API_KEY: str | None = os.getenv("GROQ_API_KEY")
    GROQ_BASE_URL: str = os.getenv(
        "GROQ_BASE_URL",
        "https://api.groq.com/openai/v1",
    )
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    GROQ_TIMEOUT_SECONDS: float = float(os.getenv("GROQ_TIMEOUT_SECONDS", "60"))
    GROQ_CONNECT_TIMEOUT_SECONDS: float = float(
        os.getenv("GROQ_CONNECT_TIMEOUT_SECONDS", "10")
    )
    GROQ_MAX_TOKENS: int = int(os.getenv("GROQ_MAX_TOKENS", "2048"))

    # ==========================================================
    # Deepgram Voice AI Configuration
    # ==========================================================

    DEEPGRAM_API_KEY: str | None = os.getenv("DEEPGRAM_API_KEY")
    VOICE_STT_PROVIDER: str = os.getenv("VOICE_STT_PROVIDER", "deepgram").strip().lower()
    DEEPGRAM_STT_MODEL: str = os.getenv("DEEPGRAM_STT_MODEL", "nova-3")
    DEEPGRAM_LIVE_MODEL: str = os.getenv("DEEPGRAM_LIVE_MODEL", "nova-3")
    DEEPGRAM_TTS_MODEL: str = os.getenv("DEEPGRAM_TTS_MODEL", "aura-2-thalia-en")
    DEEPGRAM_LANGUAGE: str = os.getenv("DEEPGRAM_LANGUAGE", "en")
    DEEPGRAM_MAX_AUDIO_BYTES: int = (
        int(os.getenv("DEEPGRAM_MAX_AUDIO_MB", "25")) * 1024 * 1024
    )
    DEEPGRAM_ALLOWED_AUDIO_EXTENSIONS = {
        ".aac",
        ".flac",
        ".m4a",
        ".mp3",
        ".mp4",
        ".mpeg",
        ".ogg",
        ".opus",
        ".wav",
        ".webm",
    }
    GENERATED_AUDIO_DIR: str = os.getenv("GENERATED_AUDIO_DIR", "generated_audio")

    # ==========================================================
    # Interview Engine Configuration
    # ==========================================================

    INTERVIEW_MAX_QUESTIONS: int = 10

    INTERVIEW_TEMPERATURE: float = 0.4

    INTERVIEW_EVALUATION_TEMPERATURE: float = 0.0

    INTERVIEW_FEEDBACK_TEMPERATURE: float = 0.0


settings = Settings()
