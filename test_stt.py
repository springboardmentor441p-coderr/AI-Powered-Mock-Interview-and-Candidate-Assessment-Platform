from deepgram import DeepgramClient, PrerecordedOptions
from dotenv import load_dotenv
import os

load_dotenv()

deepgram = DeepgramClient(os.getenv("DEEPGRAM_API_KEY"))

with open("test_audio/Recording.m4a", "rb") as audio:
    source = {
        "buffer": audio.read(),
    }

options = PrerecordedOptions(
    model="nova-3",
    smart_format=True,
)

response = deepgram.listen.prerecorded.v("1").transcribe_file(
    source,
    options,
)

transcript = response.results.channels[0].alternatives[0].transcript

print(transcript)