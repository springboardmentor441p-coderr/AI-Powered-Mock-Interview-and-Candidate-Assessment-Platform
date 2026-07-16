from docling.document_converter import DocumentConverter
import os

# Common tech skills list
KNOWN_SKILLS = [
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
    "sql", "mysql", "postgresql", "sqlite", "mongodb", "redis",
    "fastapi", "django", "flask", "react", "vue", "angular", "node.js",
    "html", "css", "tailwind",
    "machine learning", "deep learning", "nlp", "computer vision",
    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "keras",
    "opencv", "mediapipe",
    "docker", "kubernetes", "aws", "azure", "gcp",
    "git", "github", "linux", "bash",
    "pyspark", "hadoop", "kafka", "airflow",
    "rest api", "graphql", "microservices",
    "streamlit", "powerbi", "tableau",
]


def extract_text_with_docling(file_path: str) -> str:
    """Use Docling to extract text from PDF — smarter than raw text extraction."""
    converter = DocumentConverter()
    result = converter.convert(file_path)
    # Convert to markdown format — preserves structure (headings, sections)
    markdown_text = result.document.export_to_markdown()
    return markdown_text


def extract_skills(text: str) -> list:
    """Match text against known skills list."""
    text_lower = text.lower()
    found_skills = []
    for skill in KNOWN_SKILLS:
        if skill in text_lower:
            found_skills.append(skill)
    return found_skills


def extract_education(text: str) -> str:
    """Extract education details from parsed text."""
    education_keywords = [
        "b.tech", "b.e", "m.tech", "mca", "bca", "bsc", "msc",
        "bachelor", "master", "phd", "degree", "university", "college"
    ]
    lines = text.split("\n")
    education_lines = []
    for line in lines:
        if any(kw in line.lower() for kw in education_keywords):
            education_lines.append(line.strip())
    return " | ".join(education_lines[:3]) if education_lines else "Not found"


def extract_experience(text: str) -> str:
    """Extract experience details from parsed text."""
    exp_keywords = [
        "experience", "internship", "worked at", "working at",
        "project", "developer", "engineer", "analyst"
    ]
    lines = text.split("\n")
    exp_lines = []
    for line in lines:
        if any(kw in line.lower() for kw in exp_keywords):
            exp_lines.append(line.strip())
    return " | ".join(exp_lines[:5]) if exp_lines else "Not found"


def parse_resume(file_path: str) -> dict:
    """
    Main function — PDF path lo, parsed data return karo.
    Docling se text extract karo, phir skills/education/experience nikalo.
    """
    # Step 1: Docling se text extract karo
    text = extract_text_with_docling(file_path)

    # Step 2: Skills nikalo
    skills = extract_skills(text)

    # Step 3: Education nikalo
    education = extract_education(text)

    # Step 4: Experience nikalo
    experience = extract_experience(text)

    return {
        "extracted_text": text,
        "skills": ", ".join(skills),
        "education": education,
        "experience": experience,
        "summary": f"Found {len(skills)} skills: {', '.join(skills[:5])}{'...' if len(skills) > 5 else ''}"
    }