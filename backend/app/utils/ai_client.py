import os
import logging
import httpx
from typing import Any

logger = logging.getLogger("ai_client")


def get_gemini_api_key() -> str | None:
    return os.getenv("GEMINI_API_KEY")


async def generate_text(prompt: str, system_instruction: str = "") -> str | None:
    """
    Query Google's Gemini API via httpx if GEMINI_API_KEY is available.
    Otherwise, returns None (triggering local fallback).
    """
    api_key = get_gemini_api_key()
    if not api_key:
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    # Structure system instructions and user prompt
    contents = []
    if system_instruction:
        contents.append({
            "role": "user",
            "parts": [{"text": f"System Instructions: {system_instruction}\n\nTask: {prompt}"}]
        })
    else:
        contents.append({
            "role": "user",
            "parts": [{"text": prompt}]
        })

    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "topP": 0.95,
            "maxOutputTokens": 1024,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code == 200:
                data = response.json()
                # Extract text response from Gemini's response schema
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
            else:
                logger.error(f"Gemini API returned status code {response.status_code}: {response.text}")
    except Exception as e:
        logger.error(f"Failed to communicate with Gemini API: {e}")

    return None
