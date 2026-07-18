from deepgram import DeepgramClient
from dotenv import load_dotenv
import os

load_dotenv()

deepgram = DeepgramClient(os.getenv("DEEPGRAM_API_KEY"))

text = {
    "text": "Hello Mahir. Welcome to your AI interview."
}

with open("output.mp3", "wb") as file:
    response = deepgram.speak.v("1").save(
        file,
        text,
        {
            "model": "aura-2-thalia-en",
        },
    )

print("Audio saved as output.mp3")