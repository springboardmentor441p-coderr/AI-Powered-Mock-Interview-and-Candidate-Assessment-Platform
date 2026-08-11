"""
services/resume_parser.py — Extract text + skills from PDF / DOCX resumes

Flow:
  1. Detect file type
  2. Extract raw text (PyMuPDF for PDF, python-docx for DOCX)
  3. Extract skills by matching against a skill keyword list
  4. Return structured dict
"""
import re
from pathlib import Path

# ── Common tech skills to detect ──────────────────────────────────────────────
SKILL_KEYWORDS = [
    # Programming
    "python","java","javascript","typescript","c++","c#","go","rust","kotlin","swift",
    # Web
    "react","vue","angular","nextjs","html","css","tailwind","fastapi","django","flask",
    "nodejs","express","spring boot",
    # Data / AI
    "tensorflow","pytorch","sklearn","scikit-learn","pandas","numpy","opencv","mediapipe",
    "deepface","whisper","openai","langchain","huggingface","nlp","machine learning",
    "deep learning","computer vision","data science",
    # DB
    "postgresql","mysql","sqlite","mongodb","redis","firebase",
    # DevOps / Cloud
    "docker","kubernetes","aws","azure","gcp","github actions","ci/cd","linux",
    # Other
    "rest api","graphql","websocket","jwt","oauth","sql","git","agile","scrum",
]


def extract_text_from_pdf(file_path: str) -> str:
    """Extract all text from a PDF file using PyMuPDF."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except ImportError:
        return "[PyMuPDF not installed — install pymupdf]"
    except Exception as e:
        return f"[PDF read error: {e}]"


def extract_text_from_docx(file_path: str) -> str:
    """Extract all text from a DOCX file."""
    try:
        from docx import Document
        doc = Document(file_path)
        return "\n".join(para.text for para in doc.paragraphs)
    except ImportError:
        return "[python-docx not installed — install python-docx]"
    except Exception as e:
        return f"[DOCX read error: {e}]"


def extract_text_from_txt(file_path: str) -> str:
    with open(file_path, "r", errors="ignore") as f:
        return f.read()


def extract_text(file_path: str) -> str:
    """Auto-detect file type and extract text."""
    path = Path(file_path)
    ext  = path.suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in (".docx", ".doc"):
        return extract_text_from_docx(file_path)
    else:
        return extract_text_from_txt(file_path)


def extract_skills(text: str) -> list[str]:
    """Find skill keywords in resume text (case-insensitive)."""
    text_lower = text.lower()
    found = []
    for skill in SKILL_KEYWORDS:
        # word-boundary match so "go" doesn't match "good"
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found.append(skill.title() if len(skill) > 3 else skill.upper())
    return list(dict.fromkeys(found))  # deduplicate, preserve order


def extract_experience_years(text: str) -> int:
    """Rough extraction of years of experience from resume text."""
    patterns = [
        r'(\d+)\+?\s*years?\s+of\s+experience',
        r'experience\s+of\s+(\d+)\+?\s*years?',
        r'(\d+)\+?\s*years?\s+experience',
    ]
    for pat in patterns:
        match = re.search(pat, text.lower())
        if match:
            return int(match.group(1))
    return 0


def parse_resume(file_path: str) -> dict:
    """
    Main entry point.
    Returns: { text, skills, experience_years, preview }
    """
    text = extract_text(file_path)
    skills = extract_skills(text)
    exp_years = extract_experience_years(text)
    preview = text[:500].strip()

    return {
        "full_text": text,
        "skills": skills,
        "experience_years": exp_years,
        "preview": preview,
        "word_count": len(text.split()),
    }
