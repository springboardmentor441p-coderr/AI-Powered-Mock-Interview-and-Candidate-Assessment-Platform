"""
ATS (Applicant Tracking System) score simulator.

Approximates how a real ATS parser (Workday, Greenhouse, Taleo-style keyword
and formatting scanners) would score a resume: presence of contact info,
standard section headers, skill keyword density, quantifiable achievements,
action verbs, and length/formatting sanity. Fully deterministic, offline,
explainable — no external ATS API required.
"""
import re
from typing import Dict, List

CONTACT_EMAIL_RE = re.compile(r"[\w\.\-]+@[\w\-]+\.[a-zA-Z]{2,}")
CONTACT_PHONE_RE = re.compile(r"(\+?\d[\d\-\s()]{8,}\d)")

SECTION_HEADERS = [
    "experience", "work experience", "employment", "education", "skills",
    "projects", "certifications", "summary", "objective", "achievements",
]

ACTION_VERBS = [
    "led", "built", "developed", "designed", "implemented", "created",
    "managed", "improved", "increased", "reduced", "optimized", "launched",
    "architected", "delivered", "automated", "collaborated", "analyzed",
    "spearheaded", "streamlined", "achieved",
]

QUANTIFIER_RE = re.compile(r"\b\d+(\.\d+)?\s*(%|percent|x|k|million|years?|users?|customers?)\b", re.I)


def _score_contact_info(text: str) -> Dict:
    has_email = bool(CONTACT_EMAIL_RE.search(text))
    has_phone = bool(CONTACT_PHONE_RE.search(text))
    score = (50 if has_email else 0) + (50 if has_phone else 0)
    return {"score": score, "has_email": has_email, "has_phone": has_phone}


def _score_sections(text: str) -> Dict:
    lower = text.lower()
    found = [h for h in SECTION_HEADERS if h in lower]
    # A well-structured resume usually has at least: experience/projects, education, skills
    score = min(100, len(set(found)) * 18)
    return {"score": score, "sections_found": sorted(set(found))}


def _score_keywords(skills: List[str]) -> Dict:
    # More distinct recognizable skill keywords = better keyword-matchability for ATS
    score = min(100, len(skills) * 10)
    return {"score": score, "skill_count": len(skills)}


def _score_achievements(text: str) -> Dict:
    lower = text.lower()
    action_verb_hits = sum(1 for v in ACTION_VERBS if re.search(rf"\b{v}\b", lower))
    quantified_hits = len(QUANTIFIER_RE.findall(text))
    score = min(100, action_verb_hits * 8 + quantified_hits * 10)
    return {"score": score, "action_verbs_found": action_verb_hits, "quantified_achievements": quantified_hits}


def _score_length(text: str) -> Dict:
    word_count = len(re.findall(r"\b\w+\b", text))
    if 300 <= word_count <= 900:
        score = 100
    elif word_count < 300:
        score = max(30, (word_count / 300) * 100)
    else:
        score = max(40, 100 - (word_count - 900) / 20)
    return {"score": round(score, 1), "word_count": word_count}


def compute_ats_score(text: str, skills: List[str]) -> Dict:
    contact = _score_contact_info(text)
    sections = _score_sections(text)
    keywords = _score_keywords(skills)
    achievements = _score_achievements(text)
    length = _score_length(text)

    # Weights: Contact info 15%, Sections 20%, Keywords 30%, Achievements 20%, Length/format 15%
    overall = round(
        contact["score"] * 0.15
        + sections["score"] * 0.20
        + keywords["score"] * 0.30
        + achievements["score"] * 0.20
        + length["score"] * 0.15,
        1,
    )

    tips = []
    if not contact["has_email"]:
        tips.append("Add a professional email address near the top of your resume.")
    if not contact["has_phone"]:
        tips.append("Add a phone number so recruiters can reach you.")
    if sections["score"] < 70:
        tips.append("Use clear standard section headers like 'Experience', 'Education', and 'Skills'.")
    if keywords["score"] < 50:
        tips.append("Add more role-relevant technical keywords/skills that match the job description.")
    if achievements["score"] < 40:
        tips.append("Start bullet points with action verbs (Built, Led, Improved) and quantify results (e.g. 'reduced load time by 30%').")
    if length["score"] < 70:
        tips.append("Aim for a resume length of roughly 300-900 words (about 1 page) for optimal ATS parsing.")
    if not tips:
        tips.append("Your resume is well-optimized for ATS parsing. Keep it updated with new quantified achievements.")

    return {
        "overall_score": overall,
        "breakdown": {
            "contact_info": contact,
            "section_structure": sections,
            "keyword_match": keywords,
            "achievements_impact": achievements,
            "length_format": length,
        },
        "tips": tips,
    }
