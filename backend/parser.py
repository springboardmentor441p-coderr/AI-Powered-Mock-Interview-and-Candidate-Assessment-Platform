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

    section = text[start:end].strip()

    return section if section else "Not Found"



def extract_resume_details(pdf_path):

    # ---------------------------
    # Open PDF and extract text
    # ---------------------------

    doc = fitz.open(pdf_path)

    text = ""

    for page in doc:
        text += page.get_text()

    doc.close()


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
            and "resume" not in line.lower()
            and len(line.split()) >= 2
            and len(line) < 40
        ):
            name = line
            break



    # ---------------------------
    # Email
    # ---------------------------

    email = re.findall(
        r'[\w\.-]+@[\w\.-]+\.\w+',
        text
    )



    # ---------------------------
    # Phone
    # ---------------------------

    phone = re.findall(
        r'(\+?\d[\d\s\-]{8,15})',
        text
    )



    # ---------------------------
    # Skills
    # ---------------------------

    extracted_skills = []

    try:

        with open("skills.txt", "r") as f:

            skills = [
                skill.strip()
                for skill in f.readlines()
                if skill.strip()
            ]


        for skill in skills:

            if skill.lower() in text.lower():

                extracted_skills.append(skill)


    except FileNotFoundError:

        extracted_skills = []



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
            "Languages",
            "Projects",
            "Experience"
        ]
    )


    if certifications == "Not Found":

        certifications = extract_section(
            text,
            "Certificates",
            [
                "Achievements",
                "Languages",
                "Projects",
                "Experience"
            ]
        )



    # ---------------------------
    # Languages
    # ---------------------------

    languages = extract_section(
        text,
        "Languages",
        [
            "Skills",
            "Projects",
            "Experience",
            "Certifications"
        ]
    )



    # ---------------------------
    # Return JSON
    # ---------------------------

    return {

        "name": name,

        "email": email[0] if email else "Not Found",

        "phone": phone[0].strip() if phone else "Not Found",

        "education": education,

        "experience": (
            experience
            if experience != "Not Found"
            else "Fresher"
        ),

        "projects": projects,

        "certifications": certifications,

        "languages": languages,

        "skills": extracted_skills,

        "resume_text": text

    }