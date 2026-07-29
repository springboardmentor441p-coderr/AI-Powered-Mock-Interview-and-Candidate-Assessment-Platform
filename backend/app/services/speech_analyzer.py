"""
Speech & Text Analyzer Service.

Analyzes candidate transcripts and audio metadata for:
- Filler word frequency ("um", "uh", "like", "you know", "basically", etc.)
- Speaking pace (Words Per Minute - WPM)
- Vocabulary quality and sentence complexity
- Structural clarity and response completeness
"""

import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

FILLER_WORDS: set[str] = {
    "um", "uh", "er", "ah", "like", "you know", "basically",
    "actually", "sort of", "kind of", "i mean", "honestly", "literally", "stuff"
}


class SpeechAnalyzer:
    """
    Analyzes linguistic and speech characteristics from transcript text and timing metadata.
    """

    @classmethod
    def analyze_transcript(
        cls,
        text: str,
        response_time_seconds: float = 0.0,
    ) -> dict[str, Any]:
        """
        Analyze transcript text and calculate key speech metrics.

        Returns:
            dict containing word_count, filler_count, filler_frequency,
            speaking_pace_wpm, sentence_count, avg_words_per_sentence,
            vocabulary_richness, and clarity_index.
        """
        cleaned_text = (text or "").strip()
        words = re.findall(r"\b\w+\b", cleaned_text.lower())
        word_count = len(words)

        if word_count == 0:
            return {
                "word_count": 0,
                "filler_count": 0,
                "filler_frequency": 0.0,
                "speaking_pace_wpm": 0.0,
                "sentence_count": 0,
                "avg_words_per_sentence": 0.0,
                "vocabulary_richness": 0.0,
                "clarity_index": 0.0,
            }

        # Filler word count matching
        text_lower = cleaned_text.lower()
        filler_count = 0
        for filler in FILLER_WORDS:
            if " " in filler:
                filler_count += text_lower.count(filler)
            else:
                filler_count += sum(1 for w in words if w == filler)

        filler_frequency = round((filler_count / word_count) * 100.0, 2)

        # Speaking pace (WPM) estimation
        wpm = 0.0
        if response_time_seconds > 1.0:
            wpm = round((word_count / response_time_seconds) * 60.0, 1)

        # Sentence analysis
        sentences = [s.strip() for s in re.split(r"[.!?]+", cleaned_text) if s.strip()]
        sentence_count = max(1, len(sentences))
        avg_words_per_sentence = round(word_count / sentence_count, 1)

        # Vocabulary richness (unique words ratio)
        unique_words = len(set(words))
        vocabulary_richness = round((unique_words / word_count) * 100.0, 1)

        # Clarity index (0.0 - 100.0 score based on word length, fillers, and structure)
        filler_penalty = min(40.0, filler_frequency * 3.0)
        length_bonus = min(30.0, word_count * 0.3)
        clarity_index = round(max(10.0, min(100.0, 70.0 - filler_penalty + length_bonus)), 1)

        return {
            "word_count": word_count,
            "filler_count": filler_count,
            "filler_frequency": filler_frequency,
            "speaking_pace_wpm": wpm,
            "sentence_count": sentence_count,
            "avg_words_per_sentence": avg_words_per_sentence,
            "vocabulary_richness": vocabulary_richness,
            "clarity_index": clarity_index,
        }
