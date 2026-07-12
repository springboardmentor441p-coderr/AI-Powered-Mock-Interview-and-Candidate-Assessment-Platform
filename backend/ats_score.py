def calculate_score(data):

    score = 0
    feedback = []

    # Name
    if data.get("name"):
        score += 10
    else:
        feedback.append("Name Missing")

    # Email
    if data.get("email"):
        score += 10
    else:
        feedback.append("Email Missing")

    # Phone
    if data.get("phone"):
        score += 10
    else:
        feedback.append("Phone Number Missing")

    # Skills
    skills = data.get("skills", [])

    score += min(len(skills) * 5, 40)

    if len(skills) < 5:
        feedback.append("Add more technical skills")

    return {
        "score": score,
        "feedback": feedback
    }