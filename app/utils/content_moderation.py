"""
Content moderation for interview responses.
"""
import re

from app.utils.constants import (
    MODERATION_CANCELLATION_MESSAGE,
    PROFANITY_WORDS,
    SENSITIVE_WORDS,
)


class ContentModerationService:
    """Detect profanity and sensitive language in candidate responses."""

    @staticmethod
    def check_text(text: str) -> dict:
        """
        Check text for profanity or sensitive words.

        Args:
            text: Candidate response text to validate.

        Returns:
            Dictionary with is_violation flag, matched words, and reason.
        """
        if not text or not text.strip():
            return {
                "is_violation": False,
                "matched_words": [],
                "reason": "",
            }

        normalized = text.lower()
        normalized = re.sub(r"[^\w\s]", " ", normalized)
        tokens = set(normalized.split())

        matched: list[str] = []

        for word in PROFANITY_WORDS + SENSITIVE_WORDS:
            word_lower = word.lower()
            if " " in word_lower:
                if word_lower in normalized:
                    matched.append(word)
            elif word_lower in tokens:
                matched.append(word)

        if matched:
            return {
                "is_violation": True,
                "matched_words": matched,
                "reason": MODERATION_CANCELLATION_MESSAGE,
            }

        return {
            "is_violation": False,
            "matched_words": [],
            "reason": "",
        }
