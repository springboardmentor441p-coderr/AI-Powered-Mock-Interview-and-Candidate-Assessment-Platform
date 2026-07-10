"""
Core business logic for parsing an uploaded resume file into structured JSON.

This module ties together text extraction (PDF/DOCX) and the Ollama
LLM service, and is kept independent of FastAPI so it can be tested or
reused outside of the HTTP layer.
"""

import logging
from pathlib import Path

from app.services.ollama_service import (
    OllamaConnectionError,
    OllamaInvalidResponseError,
    parse_llm_json_response,
    query_ollama_for_resume_json,
)
from app.utils.docx_utils import DOCXExtractionError, extract_text_from_docx
from app.utils.pdf_utils import PDFExtractionError, extract_text_from_pdf

logger = logging.getLogger(__name__)

# Expected top-level keys in the parsed resume JSON. Used to make sure
# the response always has a consistent shape, even if the LLM omits a key.
_EXPECTED_LIST_FIELDS = ("skills", "education", "experience", "projects",
                         "certifications", "languages")
_EXPECTED_STRING_FIELDS = ("name", "email", "phone", "linkedin", "github",
                          "portfolio", "location", "summary")


class UnsupportedFileTypeError(Exception):
    """Raised when the uploaded file extension is not supported."""


class ResumeParsingError(Exception):
    """Raised for any failure during the end-to-end resume parsing flow."""


def extract_resume_text(filename: str, file_bytes: bytes) -> str:
    """
    Extract raw text from a resume file based on its extension.

    Args:
        filename: Original filename of the uploaded file (used to
            determine the file type via its extension).
        file_bytes: Raw bytes of the uploaded file.

    Returns:
        The extracted plain text content of the resume.

    Raises:
        UnsupportedFileTypeError: If the file extension is not .pdf/.docx.
        PDFExtractionError: If PDF text extraction fails.
        DOCXExtractionError: If DOCX text extraction fails.
    """
    extension = Path(filename).suffix.lower()

    if extension == ".pdf":
        return extract_text_from_pdf(file_bytes)
    if extension == ".docx":
        return extract_text_from_docx(file_bytes)

    raise UnsupportedFileTypeError(f"Unsupported file extension: {extension}")


def _normalize_resume_json(data: dict) -> dict:
    """
    Ensure the parsed resume JSON always contains the expected keys.

    Fills in missing string fields with None and missing list fields
    with an empty list, so API consumers get a predictable schema
    regardless of what the LLM chose to omit.

    Args:
        data: The raw dict parsed from the LLM's JSON output.

    Returns:
        A normalized dict guaranteed to contain all expected keys.
    """
    normalized = dict(data)

    for field in _EXPECTED_STRING_FIELDS:
        normalized.setdefault(field, None)

    for field in _EXPECTED_LIST_FIELDS:
        value = normalized.get(field)
        normalized[field] = value if isinstance(value, list) else []

    return normalized


def parse_resume(filename: str, file_bytes: bytes) -> dict:
    """
    Run the full resume parsing pipeline: extract text, query the LLM,
    and return normalized structured JSON.

    Args:
        filename: Original filename of the uploaded file.
        file_bytes: Raw bytes of the uploaded file.

    Returns:
        A dict containing the structured resume data.

    Raises:
        UnsupportedFileTypeError: If the file type isn't supported.
        PDFExtractionError: If PDF text extraction fails.
        DOCXExtractionError: If DOCX text extraction fails.
        OllamaConnectionError: If Ollama cannot be reached.
        OllamaInvalidResponseError: If Ollama's response isn't valid JSON.
    """
    resume_text = extract_resume_text(filename, file_bytes)
    logger.info("Extracted %d characters of resume text from '%s'",
                len(resume_text), filename)

    raw_llm_response = query_ollama_for_resume_json(resume_text)
    parsed_json = parse_llm_json_response(raw_llm_response)

    return _normalize_resume_json(parsed_json)
