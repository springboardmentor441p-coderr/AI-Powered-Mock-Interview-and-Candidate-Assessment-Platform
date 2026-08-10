"""
Resume text extractor and structured-field parser.

Supports PDF (via PyMuPDF / fitz) and DOCX (via python-docx).
Parsing uses regex heuristics — no external API required.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


# ---------------------------------------------------------------------------
# Text extraction
# ---------------------------------------------------------------------------

def extract_text_from_pdf(file_path: str) -> str:
    """Extract all text from a PDF using PyMuPDF (fitz)."""
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(file_path)
        pages: list[str] = []
        for page in doc:
            pages.append(page.get_text("text"))  # type: ignore[arg-type]
        doc.close()
        return "\n".join(pages)
    except Exception as exc:  # noqa: BLE001
        raise ValueError(f"Failed to read PDF: {exc}") from exc


def extract_text_from_docx(file_path: str) -> str:
    """Extract all text from a DOCX file using python-docx."""
    try:
        from docx import Document

        doc = Document(file_path)
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        return "\n".join(paragraphs)
    except Exception as exc:  # noqa: BLE001
        raise ValueError(f"Failed to read DOCX: {exc}") from exc


def extract_text(file_path: str) -> str:
    """Route to the correct extractor based on file extension."""
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    if ext in (".docx", ".doc"):
        return extract_text_from_docx(file_path)
    raise ValueError(f"Unsupported file type: {ext}")


# ---------------------------------------------------------------------------
# Field parsers (regex heuristics)
# ---------------------------------------------------------------------------

_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
_PHONE_RE = re.compile(
    r"(?:\+?\d{1,3}[\s\-]?)?(?:\(?\d{2,4}\)?[\s\-]?)?\d{3,4}[\s\-]?\d{3,5}"
)

# Common section headings used in resumes
_SECTION_PATTERNS = {
    "summary":        re.compile(r"^\s*(summary|objective|profile|about me)\s*$", re.I),
    "skills":         re.compile(r"^\s*(skills?|technical skills?|core competencies|technologies)\s*$", re.I),
    "education":      re.compile(r"^\s*(education|academic|qualification|degree)\s*$", re.I),
    "experience":     re.compile(r"^\s*(experience|work experience|employment|career|professional experience)\s*$", re.I),
    "projects":       re.compile(r"^\s*(projects|personal projects|academic projects|key projects)\s*$", re.I),
    "certifications": re.compile(r"^\s*(certifications?|credentials?|licenses?|courses?)\s*$", re.I),
}

# Well-known skills to match against raw text (extend freely)
_KNOWN_SKILLS = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP",
    "React", "Vue", "Angular", "Next.js", "Nuxt", "Svelte",
    "Node.js", "Express", "FastAPI", "Django", "Flask", "Spring", "Laravel",
    "SQL", "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Elasticsearch",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "Ansible",
    "Git", "GitHub", "GitLab", "CI/CD", "Jenkins", "GitHub Actions",
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "scikit-learn",
    "REST", "GraphQL", "gRPC", "Microservices", "Agile", "Scrum",
    "Linux", "Bash", "PowerShell", "HTML", "CSS", "Tailwind", "Bootstrap",
]

# Categorization maps (lowercase for matching)
_PROGRAMMING_LANGUAGES = {"python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "ruby", "php", "sql", "html", "css", "bash", "r", "scala", "kotlin", "swift"}
_FRAMEWORKS = {"react", "vue", "angular", "next.js", "nuxt", "svelte", "fastapi", "django", "flask", "spring", "spring boot", "laravel", "express", "nest.js", "asp.net", "rails"}
_LIBRARIES = {"numpy", "pandas", "scipy", "scikit-learn", "sklearn", "tensorflow", "pytorch", "keras", "matplotlib", "seaborn", "opencv", "nltk", "spacy", "huggingface", "transformers", "redux", "jquery", "bootstrap", "tailwind"}
_DATABASES = {"postgresql", "postgres", "mysql", "sqlite", "mongodb", "redis", "elasticsearch", "cassandra", "mariadb", "dynamodb", "neo4j", "oracle", "sql server"}
_CLOUD_TECHNOLOGIES = {"aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s", "terraform", "ansible", "jenkins", "heroku", "netlify", "vercel", "digitalocean"}
_TOOLS = {"git", "github", "gitlab", "bitbucket", "jira", "confluence", "trello", "slack", "vscode", "postman", "figma", "webpack", "vite", "npm", "yarn"}


def _extract_email(text: str) -> str | None:
    match = _EMAIL_RE.search(text)
    return match.group() if match else None


def _extract_phone(text: str) -> str | None:
    match = _PHONE_RE.search(text)
    raw = match.group().strip() if match else None
    if raw and len(re.sub(r"\D", "", raw)) >= 7:
        return raw
    return None


def _extract_name(text: str) -> str | None:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    for line in lines[:10]:
        if _EMAIL_RE.search(line):
            continue
        if _PHONE_RE.search(line):
            continue
        if re.search(r"https?://|www\.", line, re.I):
            continue
        words = line.split()
        if 2 <= len(words) <= 5:
            if all(w[0].isupper() for w in words if w.isalpha()):
                return line
    return None


def _extract_skills(text: str) -> list[str]:
    found: list[str] = []
    for skill in _KNOWN_SKILLS:
        pattern = re.compile(r"\b" + re.escape(skill) + r"\b", re.I)
        if pattern.search(text):
            found.append(skill)
    return found


def _split_into_sections(text: str) -> dict[str, str]:
    lines = text.splitlines()
    sections: dict[str, list[str]] = {"header": []}
    current_section = "header"

    for line in lines:
        matched_section = None
        for section_name, pattern in _SECTION_PATTERNS.items():
            if pattern.match(line):
                matched_section = section_name
                break

        if matched_section:
            current_section = matched_section
            sections.setdefault(current_section, [])
        else:
            sections.setdefault(current_section, []).append(line)

    return {k: "\n".join(v).strip() for k, v in sections.items()}


def _extract_education(section_text: str) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    if not section_text:
        return entries

    degree_re = re.compile(
        r"(B\.?E|B\.?Tech|B\.?Sc|B\.?A|M\.?Tech|M\.?Sc|M\.?A|MBA|Ph\.?D|Bachelor|Master|Doctorate|Diploma|HSC|SSC)",
        re.I,
    )
    year_re = re.compile(r"\b(19|20)\d{2}\b")

    paragraphs = re.split(r"\n{2,}", section_text)
    for para in paragraphs:
        lines = [ln.strip() for ln in para.splitlines() if ln.strip()]
        if not lines:
            continue

        degree_match = degree_re.search(para)
        year_match = year_re.search(para)
        institution = lines[0] if lines else ""

        entries.append({
            "degree": degree_match.group() if degree_match else None,
            "institution": institution,
            "year": year_match.group() if year_match else None,
        })

    return entries[:5]


def _extract_experience(section_text: str) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    if not section_text:
        return entries

    duration_re = re.compile(
        r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\.?\s*\d{4}\s*[\-–—]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\.?\s*(\d{4}|Present|Current)",
        re.I,
    )

    paragraphs = re.split(r"\n{2,}", section_text)
    for para in paragraphs:
        lines = [ln.strip() for ln in para.splitlines() if ln.strip()]
        if not lines:
            continue

        duration_match = duration_re.search(para)
        entries.append({
            "title": lines[0] if lines else None,
            "company": lines[1] if len(lines) > 1 else None,
            "duration": duration_match.group().strip() if duration_match else None,
            "description": " ".join(lines[2:])[:300] if len(lines) > 2 else None,
        })

    return entries[:8]


def _extract_projects(section_text: str) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    if not section_text:
        return entries

    paragraphs = re.split(r"\n{2,}", section_text)
    for para in paragraphs:
        lines = [ln.strip() for ln in para.splitlines() if ln.strip()]
        if not lines:
            continue

        title = lines[0]
        desc = " ".join(lines[1:])[:400] if len(lines) > 1 else ""
        entries.append({
            "title": title,
            "description": desc
        })
    return entries[:5]


def _extract_certifications(section_text: str) -> list[str]:
    entries: list[str] = []
    if not section_text:
        return entries
    lines = [ln.strip() for ln in section_text.splitlines() if ln.strip()]
    for line in lines:
        if len(line) > 5 and not line.startswith("-") and not line.startswith("*"):
            entries.append(line)
        elif len(line) > 5:
            entries.append(line.lstrip("-* ").strip())
    return entries[:10]


def _extract_summary(section_text: str) -> str | None:
    text = section_text.strip()
    if text:
        return text[:500]
    return None


# ---------------------------------------------------------------------------
# Main parser entry-point
# ---------------------------------------------------------------------------

def parse_resume(text: str) -> dict[str, Any]:
    """
    Given the raw text of a resume, return a dict with structured fields:
      - candidate_name
      - candidate_email
      - candidate_phone
      - skills (list[str])
      - education (list[dict])
      - experience (list[dict])
      - summary (str | None)
      - projects (list[dict])
      - certifications (list[str])
      - programming_languages (list[str])
      - frameworks (list[str])
      - libraries (list[str])
      - databases (list[str])
      - cloud_technologies (list[str])
      - tools (list[str])
      - resume_score (int)
      - strong_skills (list[str])
      - weak_skills (list[str])
    """
    sections = _split_into_sections(text)

    skills_list = _extract_skills(text)
    edu_list = _extract_education(sections.get("education", ""))
    exp_list = _extract_experience(sections.get("experience", ""))
    proj_list = _extract_projects(sections.get("projects", ""))
    cert_list = _extract_certifications(sections.get("certifications", ""))

    # Categorize skills
    prog_langs = []
    frameworks = []
    libraries = []
    databases = []
    clouds = []
    tools = []

    for s in skills_list:
        sl = s.lower()
        if sl in _PROGRAMMING_LANGUAGES:
            prog_langs.append(s)
        elif sl in _FRAMEWORKS:
            frameworks.append(s)
        elif sl in _LIBRARIES:
            libraries.append(s)
        elif sl in _DATABASES:
            databases.append(s)
        elif sl in _CLOUD_TECHNOLOGIES:
            clouds.append(s)
        elif sl in _TOOLS:
            tools.append(s)

    # Compute a realistic score
    score = 30  # baseline
    score += min(len(skills_list) * 2.5, 30)  # up to 30 points for skills
    score += min(len(exp_list) * 6, 24)       # up to 24 points for experience
    score += min(len(proj_list) * 5, 16)      # up to 16 points for projects
    score += 5 if len(edu_list) > 0 else 0    # 5 points for education
    score = int(min(score, 100))

    # Identify strong vs weak skills based on descriptions
    exp_desc = " ".join([e.get("description", "") or "" for e in exp_list]).lower()
    proj_desc = " ".join([p.get("description", "") or "" for p in proj_list]).lower()
    combined_context = exp_desc + " " + proj_desc

    strong_skills = []
    weak_skills = []
    for s in skills_list:
        if s.lower() in combined_context:
            strong_skills.append(s)
        else:
            weak_skills.append(s)

    # Fallback if all skills are classified as one
    if not strong_skills and skills_list:
        strong_skills = skills_list[:len(skills_list)//2 + 1]
        weak_skills = skills_list[len(skills_list)//2 + 1:]

    return {
        "candidate_name":  _extract_name(text),
        "candidate_email": _extract_email(text),
        "candidate_phone": _extract_phone(text),
        "skills":          json.dumps(skills_list),
        "education":       json.dumps(edu_list),
        "experience":      json.dumps(exp_list),
        "summary":         _extract_summary(sections.get("summary", "")),
        "projects":        json.dumps(proj_list),
        "certifications":  json.dumps(cert_list),
        "programming_languages": json.dumps(prog_langs),
        "frameworks":      json.dumps(frameworks),
        "libraries":       json.dumps(libraries),
        "databases":       json.dumps(databases),
        "cloud_technologies": json.dumps(clouds),
        "tools":           json.dumps(tools),
        "resume_score":    score,
        "strong_skills":   json.dumps(strong_skills),
        "weak_skills":     json.dumps(weak_skills),
    }
