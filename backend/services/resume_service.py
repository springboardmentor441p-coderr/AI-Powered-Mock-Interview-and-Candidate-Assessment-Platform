import os
import re
import json
import logging
from typing import List, Dict, Optional
from services.llm_service import _call_groq, is_llm_available, GROQ_MODEL

logger = logging.getLogger(__name__)

COMMON_SKILLS = [
    "Python", "JavaScript", "React", "React.js", "Node.js", "FastAPI", "Flask", "Django", "Java", "C++", "C#",
    "SQL", "PostgreSQL", "MongoDB", "MySQL", "Redis", "Docker", "Kubernetes", "AWS", "Azure",
    "GCP", "Git", "REST API", "GraphQL", "Machine Learning", "Deep Learning", "Data Analysis",
    "HTML", "CSS", "Tailwind", "TypeScript", "Redux", "PyTorch", "TensorFlow", "Pandas", "NumPy",
    "Scikit-Learn", "Spring Boot", "Linux", "CI/CD", "DevOps", "Agile", "Scrum", "System Design",
    "Express.js", "Next.js", "Kubernetes", "Terraform", "Kafka", "Elasticsearch", "SQLAlchemy"
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
        logger.error("PDF text extraction error: %s", e)
        return ""

def analyze_resume_ats(raw_text: str, job_description: Optional[str] = "") -> Dict:
    """
    Analyzes actual extracted resume text to calculate genuine ATS score, detected skills,
    missing skills, strengths, weaknesses, and actionable recommendations.
    Uses Groq LLM (openai/gpt-oss-120b) when available passing the actual resume content.
    """
    if not raw_text or not raw_text.strip():
        return {
            "extraction_successful": False,
            "skills": [],
            "parsed_skills": [],
            "experience": "Unable to extract text from file",
            "education": "Not detected",
            "summary": "Resume text extraction failed or PDF was unreadable scan.",
            "ats_score": 0,
            "strengths": ["File uploaded successfully"],
            "weaknesses": ["Unable to extract readable text from PDF pages"],
            "missing_skills": ["Technical Keywords"],
            "suggestions": ["Upload a text-based PDF resume rather than an image scan."]
        }

    text_lower = raw_text.lower()
    jd_lower = (job_description or "").lower()

    # 1. Primary path: Use Groq LLM if available for deep resume evaluation
    if is_llm_available():
        prompt = f"""
You are an expert Applicant Tracking System (ATS) & Resume Analysis engine.

CRITICAL INSTRUCTION: Analyze the candidate's ACTUAL resume text below. Do NOT use fake hardcoded candidate data.

Candidate Resume Text:
{raw_text[:3500]}

Target Job Description Context:
{job_description if job_description else "General Software Developer Role"}

Perform a strict ATS evaluation based ONLY on the actual content of the resume:
1. Extract all technical skills actually present in the resume text.
2. Identify missing technical skills needed for the role or standard industry stack.
3. Compute a genuine ATS Match Score (0 to 100) based on skill coverage, project depth, and job description alignment.
4. List specific strengths observed in the resume text.
5. List specific weaknesses/gaps in the resume text.
6. Provide actionable suggestions to improve the candidate's resume ATS rating.

Return ONLY a valid JSON object in this format:
{{
    "ats_score": 85,
    "skills": ["Python", "FastAPI", "Docker"],
    "experience": "Mid Level",
    "education": "Bachelor of Computer Science",
    "summary": "Concise summary of candidate profile based on resume text",
    "strengths": ["Strong hands-on experience with FastAPI and PostgreSQL", "Clear project experience"],
    "weaknesses": ["Lacks explicit performance metrics", "Missing cloud deployment details"],
    "missing_skills": ["Kubernetes", "CI/CD Pipeline"],
    "suggestions": ["Add performance metrics to project descriptions", "Include cloud infrastructure tools"]
}}
"""
        content = _call_groq(prompt, temperature=0.3)
        if content:
            try:
                parsed = json.loads(content)
                if isinstance(parsed, dict) and "ats_score" in parsed:
                    parsed["extraction_successful"] = True
                    parsed["parsed_skills"] = parsed.get("skills", [])
                    parsed["raw_text_length"] = len(raw_text)
                    logger.info("Resume ATS analysis successfully completed via Groq LLM.")
                    return parsed
            except Exception as exc:
                logger.error("JSON parsing error from Groq ATS analysis: %s", exc)

    # 2. Rule-based ATS analysis directly operating on extracted text
    found_skills = []
    for skill in COMMON_SKILLS:
        if re.search(r'\b' + re.escape(skill.lower()) + r'\b', text_lower):
            found_skills.append(skill)
            
    # Calculate genuine ATS score based on matched skills
    if jd_lower:
        jd_matched = [s for s in found_skills if s.lower() in jd_lower]
        all_jd_skills = [s for s in COMMON_SKILLS if s.lower() in jd_lower]
        match_ratio = len(jd_matched) / float(max(len(all_jd_skills), 1))
        ats_score = min(98, max(25, int(match_ratio * 100)))
        missing_skills = [s for s in all_jd_skills if s not in found_skills][:5]
    else:
        ats_score = min(95, max(30, int(len(found_skills) * 9)))
        missing_skills = [s for s in ["Kubernetes", "CI/CD Pipeline", "System Design", "AWS", "Docker"] if s not in found_skills][:4]

    experience_level = "Senior/Lead Level" if any(w in text_lower for w in ["senior", "lead", "architect"]) else ("Mid Level" if any(w in text_lower for w in ["years", "developer", "engineer"]) else "Entry Level")
    education = "Computer Science / Engineering Degree" if any(w in text_lower for w in ["bachelor", "b.tech", "computer science", "master", "degree"]) else "Technical Background"
    
    strengths = []
    if found_skills:
        strengths.append(f"Demonstrated proficiency in {', '.join(found_skills[:4])}")
    if experience_level != "Entry Level":
        strengths.append(f"Relevant industry experience ({experience_level})")
    if education != "Technical Background":
        strengths.append(f"Formal education detected ({education})")
    if not strengths:
        strengths.append("Text content extracted successfully from PDF file")

    weaknesses = []
    if missing_skills:
        weaknesses.append(f"Missing key keywords: {', '.join(missing_skills[:3])}")
    if "metric" not in text_lower and "%" not in text_lower and "ms" not in text_lower:
        weaknesses.append("Lack of quantifiable performance metrics (e.g. latency, throughput, percentages)")

    suggestions = []
    if missing_skills:
        suggestions.append(f"Add missing technical skills: {', '.join(missing_skills)}")
    suggestions.append("Quantify achievements using concrete metrics (e.g. 'reduced latency by 30%')")
    suggestions.append("Ensure project descriptions detail architectural trade-offs and tooling used")

    return {
        "extraction_successful": True,
        "skills": found_skills,
        "parsed_skills": found_skills,
        "experience": experience_level,
        "education": education,
        "summary": f"Candidate profile with skills: {', '.join(found_skills[:6])}." if found_skills else "Resume parsed.",
        "ats_score": ats_score,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "missing_skills": missing_skills,
        "suggestions": suggestions,
        "raw_text_length": len(raw_text)
    }

def parse_resume(text: str) -> Dict:
    """Wrapper for backward compatibility."""
    return analyze_resume_ats(text)
