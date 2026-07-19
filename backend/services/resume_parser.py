import fitz  # PyMuPDF

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


def extract_text_with_pymupdf(file_path: str) -> str:
    """Extract text from PDF using PyMuPDF."""
    text = ""
    doc = fitz.open(file_path)
    for page in doc:
        text += page.get_text()
    doc.close()
    return text.strip()


def extract_skills(text: str) -> list:
    text_lower = text.lower()
    return [skill for skill in KNOWN_SKILLS if skill in text_lower]


def extract_education(text: str) -> str:
    keywords = [
        "b.tech", "b.e", "m.tech", "mca", "bca", "bsc", "msc",
        "bachelor", "master", "phd", "degree", "university", "college"
    ]
    lines = text.split("\n")
    found = [l.strip() for l in lines if any(k in l.lower() for k in keywords)]
    return " | ".join(found[:3]) if found else "Not found"


def extract_experience(text: str) -> str:
    keywords = [
        "experience", "internship", "worked at", "working at",
        "project", "developer", "engineer", "analyst"
    ]
    lines = text.split("\n")
    found = [l.strip() for l in lines if any(k in l.lower() for k in keywords)]
    return " | ".join(found[:5]) if found else "Not found"


def parse_resume(file_path: str) -> dict:
    text       = extract_text_with_pymupdf(file_path)
    skills     = extract_skills(text)
    education  = extract_education(text)
    experience = extract_experience(text)

    return {
        "extracted_text": text,
        "skills":         ", ".join(skills),
        "education":      education,
        "experience":     experience,
        "summary":        f"Found {len(skills)} skills: {', '.join(skills[:5])}{'...' if len(skills) > 5 else ''}"
    }