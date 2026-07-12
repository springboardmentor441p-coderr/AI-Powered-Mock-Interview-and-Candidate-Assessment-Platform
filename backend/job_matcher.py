JOB_DATABASE = {

    "Python": [
        "Python Developer",
        "Backend Developer",
        "Software Engineer"
    ],

    "FastAPI": [
        "Backend Developer",
        "API Developer"
    ],

    "SQL": [
        "Database Developer",
        "Data Analyst"
    ],

    "Java": [
        "Java Developer"
    ],

    "React": [
        "Frontend Developer"
    ],

    "Machine Learning": [
        "Machine Learning Engineer",
        "AI Engineer"
    ],

    "Data Science": [
        "Data Scientist"
    ]
}


def recommend_jobs(skills):

    jobs = set()

    for skill in skills:
        if skill in JOB_DATABASE:
            jobs.update(JOB_DATABASE[skill])

    return list(jobs)