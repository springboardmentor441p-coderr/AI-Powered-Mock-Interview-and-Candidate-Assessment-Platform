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

    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")

    # Max upload size in bytes (10 MB default, matches requirement #2)
    MAX_FILE_SIZE_BYTES: int = int(os.getenv("MAX_FILE_SIZE_MB", "10")) * 1024 * 1024

    # Allowed file extensions / content types
    ALLOWED_EXTENSIONS = {".pdf", ".docx"}
    ALLOWED_CONTENT_TYPES = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }

    # How long to wait for Ollama to respond before giving up (seconds)
    OLLAMA_TIMEOUT_SECONDS: int = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120"))


settings = Settings()
