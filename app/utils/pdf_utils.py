"""
Utility helpers for extracting raw text from PDF resumes.
"""

import io
import logging

import pdfplumber

logger = logging.getLogger(__name__)


class PDFExtractionError(Exception):
    """Raised when text cannot be extracted from a PDF file."""


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract plain text from a PDF file's raw bytes.

    Args:
        file_bytes: Raw bytes of the uploaded PDF file.

    Returns:
        The concatenated text content of every page in the PDF.

    Raises:
        PDFExtractionError: If the file cannot be opened/parsed, or if
            no extractable text is found (e.g. a scanned/image-only PDF).
    """
    try:
        text_chunks: list[str] = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                if page_text.strip():
                    text_chunks.append(page_text)

        full_text = "\n".join(text_chunks).strip()

        if not full_text:
            raise PDFExtractionError(
                "No extractable text found in PDF. The file may be "
                "empty, image-only, or corrupted."
            )

        return full_text

    except PDFExtractionError:
        raise
    except Exception as exc:  # noqa: BLE001 - convert any pdfplumber error
        logger.exception("Failed to extract text from PDF")
        raise PDFExtractionError(f"Could not read PDF file: {exc}") from exc
