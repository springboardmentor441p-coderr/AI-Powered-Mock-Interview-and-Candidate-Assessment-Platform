"""
Text normalisation for raw resume text.

`pypdf` (and other extractors) frequently return text with artefacts that
are harmless for a human reading a PDF but hostile to downstream code:
NUL bytes, stray control characters, mid-word line-wrap hyphenation,
inconsistent unicode forms (ligatures, curly quotes, non-breaking spaces),
and runs of blank lines from page breaks.

`TextNormalizer` is a small, dependency-free, single-purpose utility
(SRP) that turns that raw output into clean, storable, LLM-ready text.
It is used by `ResumeTextExtractionService` so *every* extraction path
(mock, OpenAI, Gemini, or a future provider) stores/sends the same
normalised text rather than each provider re-implementing its own
ad-hoc cleanup.
"""
import re
import unicodedata

# Control characters except \t \n \r
_CONTROL_CHARS_RE = re.compile(
    "[" + "".join(chr(c) for c in range(0, 32) if c not in (9, 10, 13)) + chr(127) + "]"
)
_NULL_BYTE_RE = re.compile("\x00")
_MULTI_SPACE_RE = re.compile(r"[ \t]+")
_MULTI_BLANK_LINES_RE = re.compile(r"\n{3,}")
_HYPHEN_LINEBREAK_RE = re.compile(r"(\w)-\n(\w)")
_TRAILING_WS_RE = re.compile(r"[ \t]+\n")

# Common unicode punctuation normalised to their ASCII equivalents so
# downstream keyword/regex matching (years of experience, degree
# keywords, skill matching) behaves consistently regardless of which
# PDF exporter produced the source document.
_CHAR_REPLACEMENTS = {
    "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"',
    "\u2013": "-", "\u2014": "-", "\u2026": "...", "\u00a0": " ",
    "\u200b": "", "\ufeff": "",
}


class TextNormalizer:
    """Normalises raw extracted text into clean, storable plain text."""

    MAX_LENGTH = 200_000  # hard ceiling so a corrupt/huge file can't blow up storage or LLM prompts

    @classmethod
    def normalize(cls, text: str | None) -> str:
        if not text:
            return ""

        # Canonical unicode form first (folds ligatures/compatibility chars).
        normalized = unicodedata.normalize("NFKC", text)

        for src, dst in _CHAR_REPLACEMENTS.items():
            normalized = normalized.replace(src, dst)

        normalized = _NULL_BYTE_RE.sub("", normalized)
        normalized = _CONTROL_CHARS_RE.sub("", normalized)

        # Rejoin words that were hyphenated purely because of a PDF
        # line-wrap, e.g. "develop-\nment" -> "development".
        normalized = _HYPHEN_LINEBREAK_RE.sub(r"\1\2", normalized)

        normalized = normalized.replace("\r\n", "\n").replace("\r", "\n")
        normalized = _TRAILING_WS_RE.sub("\n", normalized)
        normalized = _MULTI_SPACE_RE.sub(" ", normalized)
        normalized = _MULTI_BLANK_LINES_RE.sub("\n\n", normalized)

        normalized = normalized.strip()

        if len(normalized) > cls.MAX_LENGTH:
            normalized = normalized[: cls.MAX_LENGTH]

        return normalized

    @classmethod
    def is_meaningful(cls, text: str | None, *, min_chars: int = 20) -> bool:
        """True if normalised text looks like real extracted content."""
        if not text:
            return False
        return len(text.strip()) >= min_chars
