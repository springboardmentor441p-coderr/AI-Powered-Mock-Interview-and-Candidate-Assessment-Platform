"""
Resume parsing service using pdfplumber and AI.
"""
import os
import re
from typing import Optional

import pdfplumber
from flask import current_app

from app.ai.gemini_service import GeminiService
from app.extensions import db
from app.models import Resume, Skill
from app.utils.helpers import extract_email, extract_phone, save_upload_file


class ResumeParserService:
    """Parse and analyze uploaded PDF resumes."""

    COMMON_SKILLS: list[str] = [
        "Python", "Java", "JavaScript", "C++", "C#", "Ruby", "Go", "Rust",
        "HTML", "CSS", "React", "Angular", "Vue", "Node.js", "Express",
        "Django", "Flask", "Spring", "Spring Boot", "Hibernate",
        "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis",
        "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform",
        "Git", "Linux", "REST API", "GraphQL", "Microservices",
        "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch",
        "Data Science", "Pandas", "NumPy", "Scikit-learn", "NLP",
        "Computer Vision", "OpenCV", "Cyber Security", "Networking",
        "Agile", "Scrum", "CI/CD", "Jenkins", "JIRA",
        "Communication", "Leadership", "Problem Solving", "Teamwork",
    ]

    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """
        Extract text content from PDF file.

        Args:
            file_path: Absolute path to PDF.

        Returns:
            Extracted text string.
        """
        text_parts: list[str] = []
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
        except Exception as exc:
            current_app.logger.error(f"PDF extraction failed: {exc}")
        return "\n".join(text_parts)

    @staticmethod
    def extract_name(text: str) -> Optional[str]:
        """Extract candidate name from resume text."""
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for line in lines[:5]:
            if "@" not in line and len(line.split()) <= 4 and len(line) < 50:
                if not re.search(r"\d{3}", line):
                    return line
        return None

    @staticmethod
    def extract_section(text: str, section_keywords: list[str]) -> str:
        """
        Extract resume section by keyword headers.

        Args:
            text: Full resume text.
            section_keywords: Section header keywords.

        Returns:
            Section content string.
        """
        pattern = (
            r"(?i)("
            + "|".join(section_keywords)
            + r")\s*[:\-]?\s*\n?(.*?)(?=\n\s*(?:"
            + "|".join(
                [
                    "education", "experience", "skills", "projects",
                    "certifications", "summary", "objective", "work",
                ]
            )
            + r")\s*[:\-]|\Z)"
        )
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(2).strip()[:2000]
        return ""

    @staticmethod
    def extract_skills(text: str) -> list[str]:
        """
        Extract skills from resume text.

        Args:
            text: Resume text.

        Returns:
            List of matched skills.
        """
        found: list[str] = []
        text_lower = text.lower()
        for skill in ResumeParserService.COMMON_SKILLS:
            if skill.lower() in text_lower:
                found.append(skill)
        return list(dict.fromkeys(found))

    @staticmethod
    def process_upload(file, user_id: int, domain: str = "Python") -> Resume:
        """
        Process uploaded resume file end-to-end.

        Args:
            file: Uploaded file object.
            user_id: Owner user ID.
            domain: Target domain for skill gap analysis.

        Returns:
            Created Resume model instance.
        """
        relative_path = save_upload_file(file, subfolder="resumes")
        full_path = os.path.join(
            current_app.config["UPLOAD_FOLDER"], relative_path
        )

        raw_text = ResumeParserService.extract_text_from_pdf(full_path)
        name = ResumeParserService.extract_name(raw_text)
        email = extract_email(raw_text)
        phone = extract_phone(raw_text)
        education = ResumeParserService.extract_section(
            raw_text, ["education", "academic", "qualification"]
        )
        experience = ResumeParserService.extract_section(
            raw_text, ["experience", "work experience", "employment", "work history"]
        )
        projects = ResumeParserService.extract_section(
            raw_text, ["projects", "personal projects", "academic projects"]
        )
        certifications = ResumeParserService.extract_section(
            raw_text, ["certifications", "certificates", "licenses"]
        )
        skills = ResumeParserService.extract_skills(raw_text)

        summary = GeminiService.generate_resume_summary(raw_text, skills)
        missing = GeminiService.suggest_missing_skills(skills, domain)
        missing_skills_text = ", ".join(missing)

        Resume.query.filter_by(user_id=user_id, is_primary=True).update(
            {"is_primary": False}
        )

        resume = Resume(
            user_id=user_id,
            file_name=file.filename,
            file_path=relative_path,
            raw_text=raw_text,
            name=name,
            email=email,
            phone=phone,
            education=education,
            experience=experience,
            projects=projects,
            certifications=certifications,
            summary=summary,
            missing_skills=missing_skills_text,
            is_primary=True,
        )
        db.session.add(resume)
        db.session.flush()

        for skill_name in skills:
            db.session.add(
                Skill(resume_id=resume.id, name=skill_name, category="Technical")
            )

        db.session.commit()
        return resume

    @staticmethod
    def get_primary_resume(user_id: int) -> Optional[Resume]:
        """Get user's primary resume."""
        return Resume.query.filter_by(user_id=user_id, is_primary=True).first()

    @staticmethod
    def get_user_resumes(user_id: int) -> list:
        """Get all resumes for user."""
        return (
            Resume.query.filter_by(user_id=user_id)
            .order_by(Resume.created_at.desc())
            .all()
        )
