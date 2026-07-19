from deepgram import DeepgramClient
from deepgram.core import RequestOptions
import os
from dotenv import load_dotenv

load_dotenv()

deepgram = DeepgramClient(api_key=os.getenv("DEEPGRAM_API_KEY"))


def text_to_speech(text: str, output_path: str) -> str:
    """
    Convert text to speech audio file using Deepgram TTS.
    Returns the path to the generated audio file.
    """
    response = deepgram.speak.v1.audio.generate(
        text=text,
        model="aura-asteria-en",
    )

    with open(output_path, "wb") as f:
        for chunk in response:
            f.write(chunk)

    return output_path


def speech_to_text(audio_file_path: str) -> str:
    """
    Convert speech audio file to text using Deepgram STT.
    Returns the transcribed text.
    """
    with open(audio_file_path, "rb") as audio:
        buffer_data = audio.read()

    response = deepgram.listen.v1.media.transcribe_file(
        request=buffer_data,
        model="nova-2",
        smart_format=True,
        language="en",
    )

    transcript = response.results.channels[0].alternatives[0].transcript
    return transcript