import os
import re
import requests
import logging
from typing import Dict, List

logger = logging.getLogger("smarthire")
FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "actually", "sort of", "kind of", "i mean"]

def analyze_speech_communication(transcript: str, duration_seconds: float = 45.0) -> Dict:
    if not transcript:
        return {
            "filler_count": 0,
            "detected_fillers": [],
            "words_per_minute": 0,
            "pace_rating": "Too Slow",
            "clarity_score": 50.0,
            "grammar_score": 60.0
        }

    words = transcript.strip().split()
    total_words = len(words)
    
    # Calculate WPM
    minutes = max(duration_seconds / 60.0, 0.1)
    wpm = round(total_words / minutes, 1)

    # Pace classification (Optimal speaking pace is 120 - 160 WPM)
    if wpm < 100:
        pace_rating = "Slightly Slow"
    elif 100 <= wpm <= 165:
        pace_rating = "Optimal Pace"
    else:
        pace_rating = "Fast / Rushed"

    # Filler word count
    transcript_lower = transcript.lower()
    detected_fillers = {}
    total_fillers = 0
    for filler in FILLER_WORDS:
        matches = len(re.findall(r'\b' + re.escape(filler) + r'\b', transcript_lower))
        if matches > 0:
            detected_fillers[filler] = matches
            total_fillers += matches

    # Clarity and grammar heuristic metrics
    clarity_score = max(100.0 - (total_fillers * 4.0), 40.0)
    grammar_score = 90.0 if total_words > 15 else 70.0

    return {
        "filler_count": total_fillers,
        "detected_fillers": detected_fillers,
        "words_per_minute": wpm,
        "pace_rating": pace_rating,
        "clarity_score": round(clarity_score, 1),
        "grammar_score": round(grammar_score, 1)
    }

def transcribe_audio_bytes(file_bytes: bytes, filename: str = "recording.webm") -> str:
    """Transcribe raw audio bytes using Groq Whisper API (whisper-large-v3)."""
    api_key = os.getenv("GROQ_API_KEY", "")
    if not api_key:
        logger.warning("No GROQ_API_KEY available for audio transcription.")
        return ""

    url = "https://api.groq.com/openai/v1/audio/transcriptions"
    headers = {
        "Authorization": f"Bearer {api_key}"
    }
    
    files = {
        "file": (filename, file_bytes, "audio/webm")
    }
    data = {
        "model": "whisper-large-v3",
        "response_format": "json",
        "language": "en"
    }

    try:
        response = requests.post(url, headers=headers, files=files, data=data, timeout=30)
        if response.status_code == 200:
            result = response.json()
            transcript = result.get("text", "").strip()
            logger.info(f"Groq Whisper transcription successful: '{transcript}'")
            return transcript
        else:
            logger.warning(f"Groq Whisper transcription failed with status {response.status_code}: {response.text}")
            return ""
    except Exception as e:
        logger.error(f"Error during Groq Whisper transcription: {str(e)}")
        return ""
