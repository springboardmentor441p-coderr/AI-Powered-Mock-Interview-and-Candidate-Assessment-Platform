import fitz
import re


def extract_section(text, start_heading, end_headings):
    """
    Extracts text between two section headings.
    """

    text_lower = text.lower()
    start = text_lower.find(start_heading.lower())

    if start == -1:
        return "Not Found"

    start += len(start_heading)

    end = len(text)

    for heading in end_headings:
        pos = text_lower.find(heading.lower(), start)

        if pos != -1 and pos < end:
            end = pos

    return text[start:end].strip()


def extract_resume_details(pdf_path):

    # Open PDF
    doc = fitz.open(pdf_path)

    # Extract text
    text = ""

    for page in doc:
        text += page.get_text()

    # ---------------------------
    # Name
    # ---------------------------
    name = "Not Found"

    for line in text.split("\n"):

        line = line.strip()

        if (
            line
            and "@" not in line
            and "phone" not in line.lower()
            and len(line.split()) >= 2
            and len(line) < 40
        ):
            name = line
            break

    # ---------------------------
    # Email
    # ---------------------------
    email = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', text)

    # ---------------------------
    # Phone
    # ---------------------------
    phone = re.findall(r'(\+?\d[\d\s\-]{8,15})', text)

    # ---------------------------
    # Skills
    # ---------------------------
    with open("skills.txt", "r") as f:
        skills = [skill.strip() for skill in f.readlines()]

    extracted_skills = []

    for skill in skills:
        if skill.lower() in text.lower():
            extracted_skills.append(skill)

    # ---------------------------
    # Education
    # ---------------------------
    education = extract_section(
        text,
        "Education",
        [
            "Technical Skills",
            "Skills",
            "Projects",
            "Experience",
            "Internship",
            "Certifications",
            "Achievements",
            "Languages"
        ]
    )

    # ---------------------------
    # Projects
    # ---------------------------
    projects = extract_section(
        text,
        "Projects",
        [
            "Experience",
            "Internship",
            "Certifications",
            "Achievements",
            "Languages"
        ]
    )

    # ---------------------------
    # Experience / Internship
    # ---------------------------
    experience = extract_section(
        text,
        "Internship",
        [
            "Certifications",
            "Achievements",
            "Languages"
        ]
    )

    if experience == "Not Found":

        experience = extract_section(
            text,
            "Experience",
            [
                "Projects",
                "Certifications",
                "Achievements",
                "Languages"
            ]
        )

    # ---------------------------
    # Certifications
    # ---------------------------
    certifications = extract_section(
        text,
        "Certifications",
        [
            "Achievements",
            "Languages"
        ]
    )

    # ---------------------------
    # Languages
    # ---------------------------
    languages = extract_section(
        text,
        "Languages",
        []
    )

    # ---------------------------
    # Return JSON
    # ---------------------------
    return {

        "Name": name,

        "Email": email[0] if email else "Not Found",

        "Phone": phone[0].strip() if phone else "Not Found",

        "Education": education,

        "Experience": experience,

        "Projects": projects,

        "Certifications": certifications,

        "Languages": languages,

        "Skills": extracted_skills,

        "Resume_Text": text
    }