"""
Resume parsing & AI-based skill extraction.

This uses deterministic NLP-style heuristics (keyword dictionaries + regex)
rather than a remote LLM call, so the platform runs fully offline with no
API keys required. Swap `extract_skills` internals for an OpenAI / local-LLM
call if you want generative extraction in production.
"""
import re
from io import BytesIO
from typing import Dict, List

from pypdf import PdfReader

SKILL_DICTIONARY = [
    "python", "java", "javascript", "typescript", "react", "react.js", "node.js",
    "django", "flask", "fastapi", "spring boot", "sql", "postgresql", "mysql",
    "mongodb", "redis", "docker", "kubernetes", "aws", "azure", "gcp",
    "machine learning", "deep learning", "nlp", "computer vision", "tensorflow",
    "pytorch", "pandas", "numpy", "scikit-learn", "html", "css", "tailwind",
    "git", "github", "ci/cd", "rest api", "graphql", "microservices",
    "data structures", "algorithms", "system design", "agile", "scrum",
    "communication", "leadership", "problem solving", "c++", "c#", "go",
    "rust", "linux", "bash", "excel", "power bi", "tableau",
]

DEGREE_PATTERNS = [
    r"b\.?tech", r"m\.?tech", r"bachelor(?:'s)? of \w+", r"master(?:'s)? of \w+",
    r"b\.?sc", r"m\.?sc", r"mba", r"phd", r"diploma", r"b\.?e\.?", r"m\.?e\.?",
]

EXPERIENCE_PATTERN = re.compile(r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s*(?:of\s*)?experience", re.I)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(file_bytes))
    text_parts = []
    for page in reader.pages:
        text_parts.append(page.extract_text() or "")
    return "\n".join(text_parts)


def extract_skills(text: str) -> List[str]:
    lower = text.lower()
    found = []
    for skill in SKILL_DICTIONARY:
        if skill in lower:
            found.append(skill)
    return sorted(set(found))


def extract_experience_years(text: str) -> float:
    matches = EXPERIENCE_PATTERN.findall(text)
    if not matches:
        return 0.0
    return max(float(m) for m in matches)


def extract_education(text: str) -> List[str]:
    lower = text.lower()
    found = []
    for pattern in DEGREE_PATTERNS:
        if re.search(pattern, lower):
            found.append(re.search(pattern, lower).group(0).upper())
    return sorted(set(found))


def generate_summary(skills: List[str], experience_years: float, education: List[str]) -> str:
    skill_str = ", ".join(skills[:6]) if skills else "a range of technical skills"
    edu_str = education[0] if education else "a relevant academic background"
    exp_str = f"{experience_years:.1f} years" if experience_years else "entry-level"
    return (
        f"Candidate with {exp_str} of experience and {edu_str}, "
        f"demonstrating proficiency in {skill_str}."
    )


def parse_resume(file_bytes: bytes) -> Dict:
    text = extract_text_from_pdf(file_bytes)
    skills = extract_skills(text)
    experience_years = extract_experience_years(text)
    education = extract_education(text)
    summary = generate_summary(skills, experience_years, education)
    return {
        "raw_text": text,
        "skills": skills,
        "experience_years": experience_years,
        "education": education,
        "summary": summary,
    }
