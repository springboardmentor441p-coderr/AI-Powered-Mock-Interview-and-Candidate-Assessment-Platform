"""
Raw text extraction from an uploaded resume file.

Single source of truth for "how do we turn a resume file on disk into
plain text", shared by `ParsingService` and every `IResumeExtractionProvider`
(mock, OpenAI, Gemini, ...). Previously this logic was copy-pasted into
`ParsingService._extract_pdf` *and* `MockResumeExtractor._extract_pdf_text`,
which meant a fix to one silently missed the other.

Design:
- `IFileTextExtractor` (port) — one strategy per file type.
- `PdfFileTextExtractor` / `PlainFileTextExtractor` — concrete strategies.
- `ResumeTextExtractionService` — picks the right strategy by extension
  (Open/Closed: add a new file type by adding a strategy, no branching
  logic to edit) and always runs the result through `TextNormalizer`
  before handing it back, so normalisation cannot be forgotten by a
  caller.
"""
import abc
import logging
import os

from apps.resume.utils.text_normalizer import TextNormalizer

logger = logging.getLogger("smarthire")


class IFileTextExtractor(abc.ABC):
    """Port: extracts raw (un-normalised) text from a file on disk."""

    @abc.abstractmethod
    def supports(self, extension: str) -> bool:
        ...

    @abc.abstractmethod
    def extract(self, file_path: str) -> str:
        ...


class PdfFileTextExtractor(IFileTextExtractor):
    def supports(self, extension: str) -> bool:
        return extension == ".pdf"

    def extract(self, file_path: str) -> str:
        try:
            from pypdf import PdfReader  # optional dependency, imported lazily
        except ImportError:
            logger.warning("pypdf is not installed; cannot extract text from %s", file_path)
            return ""

        try:
            reader = PdfReader(file_path)
        except Exception:  # noqa: BLE001 - a corrupt/encrypted PDF must not crash the pipeline
            logger.exception("Failed to open PDF %s", file_path)
            return ""

        pages_text = []
        for page in reader.pages:
            try:
                pages_text.append(page.extract_text() or "")
            except Exception:  # noqa: BLE001 - skip unreadable pages, keep the rest
                logger.warning("Failed to extract text from a page in %s", file_path)
        return "\n".join(pages_text)


class PlainFileTextExtractor(IFileTextExtractor):
    """Fallback strategy for plain-text-ish files (.txt and anything unrecognised)."""

    def supports(self, extension: str) -> bool:
        return True  # catch-all, must be registered last

    def extract(self, file_path: str) -> str:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as fh:
                return fh.read()
        except OSError:
            logger.warning("Could not read resume file %s", file_path)
            return ""


class ResumeTextExtractionService:
    """
    Facade used by services/providers to go from `file_path` straight to
    clean, normalised text. Strategies are injected (DI) so tests can
    substitute a fake extractor without touching disk.
    """

    def __init__(self, extractors: list[IFileTextExtractor] | None = None):
        # Order matters: first matching strategy wins, catch-all last.
        self._extractors = extractors or [PdfFileTextExtractor(), PlainFileTextExtractor()]

    def extract_normalized_text(self, file_path: str) -> str:
        extension = os.path.splitext(file_path)[1].lower()
        strategy = self._select_strategy(extension)
        raw_text = strategy.extract(file_path)
        return TextNormalizer.normalize(raw_text)

    def _select_strategy(self, extension: str) -> IFileTextExtractor:
        for extractor in self._extractors:
            if extractor.supports(extension):
                return extractor
        return self._extractors[-1]
