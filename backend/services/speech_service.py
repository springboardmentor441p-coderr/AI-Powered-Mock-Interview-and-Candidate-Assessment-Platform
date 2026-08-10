"""
Speech analysis service.
- Transcribes audio using OpenAI Whisper API (or mock for testing)
- Analyses transcript for filler words, pace, grammar score, completeness
"""
import os
import re

OPENAI_KEY = os.getenv("OPENAI_API_KEY", "")

FILLER_WORDS = {"um","uh","like","you know","basically","literally","actually",
                "kind of","sort of","i mean","right","okay","so","well"}

def analyse_transcript(transcript: str, duration_seconds: float = 60) -> dict:
    """
    Given a raw transcript string, return speech feature dict.
    This runs locally — no API needed.
    """
    if not transcript:
        return _empty_features()

    words      = transcript.lower().split()
    word_count = len(words)

    # Filler word detection
    filler_hits = [w for w in words if w in FILLER_WORDS]

    # Bigram fillers
    bigrams = [f"{words[i]} {words[i+1]}" for i in range(len(words)-1)]
    filler_bigrams = [b for b in bigrams if b in FILLER_WORDS]

    all_fillers = filler_hits + filler_bigrams
    filler_count = len(all_fillers)

    # Speaking pace (words per minute)
    pace_wpm = round((word_count / max(duration_seconds, 1)) * 60)

    # Grammar score: simple heuristic — count basic errors
    sentences = re.split(r'[.!?]+', transcript.strip())
    sentences = [s.strip() for s in sentences if s.strip()]
    grammar_errors = sum(1 for s in sentences if s and s[0].islower())

    # Grammar score 0-100
    grammar_score = max(0, 100 - (grammar_errors * 10) - (filler_count * 3))

    # Clarity: penalise very short or repetitive answers
    unique_words = len(set(words))
    vocabulary_richness = round(unique_words / max(word_count, 1), 2)
    clarity_score = min(100, int(vocabulary_richness * 120))

    # Completeness: rough proxy — word count vs expected minimum
    completeness = min(100, int((word_count / 80) * 100))

    # Communication score (combined)
    communication_score = round(
        (grammar_score * 0.3) +
        (clarity_score * 0.3) +
        (completeness * 0.2) +
        (max(0, 100 - filler_count * 5) * 0.2)
    )

    return {
        "word_count":          word_count,
        "filler_count":        filler_count,
        "filler_words_found":  list(set(all_fillers))[:5],
        "pace_wpm":            pace_wpm,
        "grammar_errors":      grammar_errors,
        "grammar_score":       grammar_score,
        "clarity_score":       clarity_score,
        "completeness_score":  completeness,
        "communication_score": communication_score,
    }


async def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """
    Sends audio bytes to OpenAI Whisper for transcription.
    Returns transcript string.
    """
    if not OPENAI_KEY or OPENAI_KEY.startswith("sk-your"):
        return "[Transcription unavailable — add OPENAI_API_KEY to .env]"
    try:
        from openai import AsyncOpenAI
        import io
        client = AsyncOpenAI(api_key=OPENAI_KEY)
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = filename
        response = await client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="en",
        )
        return response.text
    except Exception as e:
        print(f"Whisper transcription failed: {e}")
        return ""


def _empty_features() -> dict:
    return {
        "word_count": 0, "filler_count": 0, "filler_words_found": [],
        "pace_wpm": 0, "grammar_errors": 0, "grammar_score": 0,
        "clarity_score": 0, "completeness_score": 0, "communication_score": 0,
    }
