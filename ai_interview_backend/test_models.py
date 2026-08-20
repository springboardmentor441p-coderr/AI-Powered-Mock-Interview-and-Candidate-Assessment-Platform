import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load your API key from the .env file
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print("Fetching available models for your API key...")

# Loop through and print every model that supports text generation
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error fetching models: {e}")