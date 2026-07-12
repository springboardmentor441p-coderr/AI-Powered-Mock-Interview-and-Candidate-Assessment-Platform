import re
import spacy

# Load English NLP model
nlp = spacy.load("en_core_web_sm")

# Skills list (we'll expand later)
SKILLS = [
    "Python",
    "Java",
    "C",
    "C++",
    "SQL",
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "Node.js",
    "FastAPI",
    "Machine Learning",
    "Deep Learning",
    "Data Science",
    "Power BI",
    "Excel",
    "Git",
    "AWS",
    "Docker"
]


def extract_resume_details(text):

    # -------------------
    # Email
    # -------------------
    email = re.findall(
        r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
        text
    )

    email = email[0] if email else ""

    # -------------------
    # Phone Number
    # -------------------
    phone = re.findall(
        r"\+?\d[\d\s\-]{8,14}\d",
        text
    )

    phone = phone[0] if phone else ""

    # -------------------
    # Name using spaCy
    # -------------------
    doc = nlp(text)

    name = ""

    for ent in doc.ents:
        if ent.label_ == "PERSON":
            name = ent.text
            break

    # -------------------
    # Skills
    # -------------------
    found_skills = []

    for skill in SKILLS:
        if skill.lower() in text.lower():
            found_skills.append(skill)

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": found_skills
    }