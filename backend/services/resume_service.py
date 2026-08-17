import re
from typing import List, Dict

COMMON_SKILLS = [
    "Python", "JavaScript", "React", "Node.js", "FastAPI", "Django", "Java", "C++", "C#",
    "SQL", "PostgreSQL", "MongoDB", "MySQL", "Redis", "Docker", "Kubernetes", "AWS", "Azure",
    "GCP", "Git", "REST API", "GraphQL", "Machine Learning", "Deep Learning", "Data Analysis",
    "HTML", "CSS", "Tailwind", "TypeScript", "Redux", "PyTorch", "TensorFlow", "Pandas", "NumPy",
    "Scikit-Learn", "FastAPI", "Spring Boot", "Linux", "CI/CD", "DevOps", "Agile", "Scrum"
]

def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    """Extract raw text from PDF bytes without fabricating fake default text on error."""
    try:
        import io
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text.strip()
    except Exception as e:
        # Return empty string if PDF text extraction fails; do not invent fake text
        return ""

def parse_resume(text: str) -> Dict:
    """
    Parse resume text to extract actual candidate skills, experience, and education.
    Does NOT invent fake skills if no skills are detected.
    """
    if not text or not text.strip():
        return {
            "extraction_successful": False,
            "skills": [],
            "experience": "Unable to extract text from uploaded file",
            "education": "Not detected",
            "summary": "Resume text extraction failed or PDF was empty/unreadable scan. Please enter your skills manually."
        }

    found_skills = []
    text_lower = text.lower()
    
    for skill in COMMON_SKILLS:
        if re.search(r'\b' + re.escape(skill.lower()) + r'\b', text_lower):
            found_skills.append(skill)
            
    # Extract project / experience heuristics from genuine text
    experience_level = "Senior/Lead Level" if "senior" in text_lower or "lead" in text_lower or "architect" in text_lower else ("Mid Level" if "years" in text_lower or "developer" in text_lower else "Entry Level")
    
    education = "Computer Science / Engineering Degree" if ("bachelor" in text_lower or "b.tech" in text_lower or "computer science" in text_lower or "master" in text_lower or "degree" in text_lower) else "Technical Background"
    
    summary = f"Candidate resume containing skills: {', '.join(found_skills[:8])}." if found_skills else "Resume parsed but no standard keyword skills matched."

    return {
        "extraction_successful": True,
        "skills": found_skills,
        "experience": experience_level,
        "education": education,
        "summary": summary,
        "raw_text_length": len(text)
    }
