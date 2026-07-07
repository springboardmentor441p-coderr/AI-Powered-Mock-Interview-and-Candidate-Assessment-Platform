import os
import random
import re

from apps.ai.providers.speech.interfaces import (
    CommunicationAnalysis,
    ICommunicationAnalysisProvider,
    ISpeechToTextProvider,
    TranscriptionResult,
)

_FILLER_WORDS = ("um", "uh", "like", "you know", "basically", "actually", "so")

_SAMPLE_TRANSCRIPTS = [
    "So, um, I think my biggest strength is, like, problem solving. "
    "I have worked on several projects where I had to, you know, debug "
    "complex issues under tight deadlines.",
    "I have around three years of experience building backend services "
    "with Python and Django. I am comfortable with REST APIs and SQL "
    "databases.",
]


class MockSpeechToTextProvider(ISpeechToTextProvider):
    """Returns a plausible transcript when no audio pipeline is configured."""

    def transcribe(self, audio_file_path: str) -> TranscriptionResult:
        exists = bool(audio_file_path) and os.path.exists(audio_file_path)
        text = random.choice(_SAMPLE_TRANSCRIPTS)
        duration = max(5.0, len(text.split()) / 2.3)
        return TranscriptionResult(
            text=text,
            confidence=0.92 if exists else 0.75,
            duration_seconds=duration,
            word_timestamps=[],
        )


class MockCommunicationAnalysisProvider(ICommunicationAnalysisProvider):
    def analyze(self, transcript: str, duration_seconds: float) -> CommunicationAnalysis:
        words = transcript.split()
        word_count = max(len(words), 1)
        text_lower = transcript.lower()

        filler_count = sum(text_lower.count(fw) for fw in _FILLER_WORDS)
        filler_ratio = filler_count / word_count

        pace_wpm = (word_count / duration_seconds) * 60 if duration_seconds else 0.0

        sentences = max(len(re.findall(r"[.!?]", transcript)), 1)
        avg_sentence_len = word_count / sentences

        grammar_score = max(0.0, min(100.0, 95 - filler_ratio * 200))
        clarity_score = max(0.0, min(100.0, 100 - abs(avg_sentence_len - 15) * 2))
        completeness_score = min(100.0, (word_count / 40) * 100)

        return CommunicationAnalysis(
            grammar_score=round(grammar_score, 2),
            filler_word_count=filler_count,
            filler_words=[fw for fw in _FILLER_WORDS if fw in text_lower],
            pace_wpm=round(pace_wpm, 2),
            clarity_score=round(clarity_score, 2),
            completeness_score=round(completeness_score, 2),
        )
