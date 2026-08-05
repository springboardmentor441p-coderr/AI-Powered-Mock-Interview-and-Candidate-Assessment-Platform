"""Run the backend's Deepgram text-to-speech path and save the result."""

import asyncio
from pathlib import Path

from app.services.deepgram_service import DeepgramService


TEXT = "Hello Mahir. Welcome to your AI interview."
OUTPUT_AUDIO = Path(__file__).parent / "output.mp3"


async def main() -> None:
    audio = await DeepgramService().text_to_speech(TEXT, output_path=OUTPUT_AUDIO)
    print(f"Audio saved as {OUTPUT_AUDIO.name} ({len(audio)} bytes)")


if __name__ == "__main__":
    asyncio.run(main())
