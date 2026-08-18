import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

# This looks for your API key. If your .env file uses a different name, change "GEMINI_API_KEY" to match it.
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)

print("Fetching allowed models for your API key...")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)