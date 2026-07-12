CAREER_SKILLS = {

    "Python Developer": [
        "Python",
        "SQL",
        "Git",
        "FastAPI"
    ],

    "Backend Developer": [
        "Python",
        "FastAPI",
        "SQL",
        "Docker",
        "Git"
    ],

    "Machine Learning Engineer": [
        "Python",
        "Machine Learning",
        "NumPy",
        "Pandas",
        "Scikit-learn",
        "TensorFlow"
    ],

    "Data Scientist": [
        "Python",
        "SQL",
        "Machine Learning",
        "Pandas",
        "NumPy",
        "Power BI"
    ],

    "Frontend Developer": [
        "HTML",
        "CSS",
        "JavaScript",
        "React"
    ]
}


def analyze_skill_gap(user_skills, target_job):

    required = CAREER_SKILLS.get(target_job, [])

    missing = []

    for skill in required:
        if skill not in user_skills:
            missing.append(skill)

    return {
        "target_job": target_job,
        "required_skills": required,
        "missing_skills": missing
    }