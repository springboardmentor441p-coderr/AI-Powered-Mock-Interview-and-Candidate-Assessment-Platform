"""
Core business logic for parsing an uploaded resume file into structured JSON.

This module ties together text extraction (PDF/DOCX) and the Groq
LLM service, and is kept independent of FastAPI so it can be tested or
reused outside of the HTTP layer.
"""

import logging
import re
from pathlib import Path

from app.services.groq_service import (
    GroqConnectionError,
    GroqInvalidResponseError,
    parse_llm_json_response,
    query_groq_for_resume_json,
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
_COMMON_SKILLS = {
    "python", "java", "javascript", "typescript", "react", "node", "fastapi",
    "django", "flask", "spring", "sql", "postgresql", "mysql", "mongodb",
    "redis", "docker", "kubernetes", "aws", "azure", "gcp", "git", "html",
    "css", "tailwind", "bootstrap", "machine learning", "deep learning",
    "nlp", "pandas", "numpy", "tensorflow", "pytorch", "linux", "rest api",
    "graphql", "microservices", "ci/cd",
}


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


def _extract_section_lines(text: str, heading: str, max_lines: int = 8) -> list[str]:
    """Best-effort section extraction used when the LLM is unavailable."""
    pattern = re.compile(
        rf"(?im)^\s*{re.escape(heading)}\s*$([\s\S]*?)(?=^\s*[A-Z][A-Z\s/&-]{{2,}}\s*$|\Z)"
    )
    match = pattern.search(text)
    if not match:
        return []

    lines = []
    for raw_line in match.group(1).splitlines():
        line = raw_line.strip(" -\u2022\t")
        if line:
            lines.append(line)
        if len(lines) >= max_lines:
            break
    return lines


def _fallback_parse_resume_text(resume_text: str) -> dict:
    """
    Deterministic parser used only when Groq times out or is unavailable.

    It keeps the API useful for upload/configuration while clearly marking the
    source so logs and callers know the LLM parse did not complete.
    """
    lines = [line.strip() for line in resume_text.splitlines() if line.strip()]
    first_lines = lines[:12]
    joined = "\n".join(lines)

    email_match = re.search(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", joined)
    phone_match = re.search(r"(?:\+?\d[\d\s().-]{7,}\d)", joined)
    linkedin_match = re.search(r"https?://(?:www\.)?linkedin\.com/\S+", joined, re.I)
    github_match = re.search(r"https?://(?:www\.)?github\.com/\S+", joined, re.I)
    portfolio_match = re.search(r"https?://(?!.*(?:linkedin|github))\S+", joined, re.I)

    name = None
    for line in first_lines:
        if "@" in line or re.search(r"\d", line) or line.lower().startswith(("http", "www")):
            continue
        if 1 <= len(line.split()) <= 5:
            name = line
            break

    lowered = joined.lower()
    skills = sorted(
        {skill.title() if skill.islower() else skill for skill in _COMMON_SKILLS if skill in lowered}
    )

    project_lines = _extract_section_lines(resume_text, "Projects", max_lines=12)
    projects = [
        {"title": line[:80], "technologies": [], "description": line}
        for line in project_lines[:5]
    ]

    experience_lines = _extract_section_lines(resume_text, "Experience", max_lines=10)
    experience = [
        {"company": None, "role": line[:80], "duration": None, "description": line}
        for line in experience_lines[:5]
    ]

    education_lines = _extract_section_lines(resume_text, "Education", max_lines=6)
    education = [
        {"institution": line[:100], "degree": None, "field": None, "cgpa": None, "year": None}
        for line in education_lines[:3]
    ]

    summary = " ".join(lines[:4])[:500] if lines else None

    return _normalize_resume_json({
        "name": name,
        "email": email_match.group(0) if email_match else None,
        "phone": phone_match.group(0).strip() if phone_match else None,
        "linkedin": linkedin_match.group(0) if linkedin_match else None,
        "github": github_match.group(0) if github_match else None,
        "portfolio": portfolio_match.group(0) if portfolio_match else None,
        "location": None,
        "summary": summary,
        "skills": skills,
        "education": education,
        "experience": experience,
        "projects": projects,
        "certifications": _extract_section_lines(resume_text, "Certifications", max_lines=5),
        "languages": _extract_section_lines(resume_text, "Languages", max_lines=5),
        "parser_source": "fallback",
        "parser_warning": "Groq timed out or was unavailable; used deterministic fallback parsing.",
    })


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
        GroqConnectionError: If Groq cannot be reached.
        GroqInvalidResponseError: If Groq's response isn't valid JSON.
    """
    resume_text = extract_resume_text(filename, file_bytes)
    logger.info("Extracted %d characters of resume text from '%s'",
                len(resume_text), filename)

    logger.info("Step 1: Resume text extracted")
    try:
        raw_llm_response = query_groq_for_resume_json(resume_text)
        logger.info("Step 2: Groq returned response")
        parsed_json = parse_llm_json_response(raw_llm_response)
    except (GroqConnectionError, GroqInvalidResponseError):
        logger.exception("Groq resume parsing failed; using fallback parser.")
        return _fallback_parse_resume_text(resume_text)

    logger.info("Step 3: Parsed structured JSON")
    parsed_json["parser_source"] = "groq"
    return _normalize_resume_json(parsed_json)
