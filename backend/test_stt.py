"""Run the backend's configured speech-to-text path against sample audio."""

import asyncio
from pathlib import Path

from app.services.deepgram_service import DeepgramService


SAMPLE_AUDIO = Path(__file__).parent / "test_audio" / "Recording.m4a"


async def main() -> None:
    transcript = await DeepgramService().speech_to_text(SAMPLE_AUDIO)
    print(transcript)


if __name__ == "__main__":
    asyncio.run(main())
