from sentence_transformers import SentenceTransformer, util

# Model ek baar load hoga server start hone pe
model = SentenceTransformer("all-MiniLM-L6-v2")

ELIGIBILITY_THRESHOLD = 0.45


def calculate_match(resume_text: str, jd_text: str) -> dict:
    """
    Resume aur JD ko embeddings se compare karo.
    Match score, matched skills, missing skills return karo.
    """
    # Dono texts ko numbers (vectors) mein convert karo
    resume_embedding = model.encode(resume_text, convert_to_tensor=True)
    jd_embedding     = model.encode(jd_text, convert_to_tensor=True)

    # Similarity calculate karo
    similarity = util.cos_sim(resume_embedding, jd_embedding)
    score = float(similarity[0][0])

    # Skills overlap nikalo
    matched_skills, missing_skills = find_skill_overlap(resume_text, jd_text)

    return {
        "match_score": round(score, 3),
        "match_percentage": round(score * 100, 1),
        "matched_skills": ", ".join(matched_skills),
        "missing_skills": ", ".join(missing_skills),
        "is_eligible": "eligible" if score >= ELIGIBILITY_THRESHOLD else "not_eligible",
        "message": get_eligibility_message(score)
    }


def find_skill_overlap(resume_text: str, jd_text: str) -> tuple:
    """JD mein jo skills hain, resume mein hain ya nahi check karo."""
    from backend.services.resume_parser import KNOWN_SKILLS

    resume_lower = resume_text.lower()
    jd_lower     = jd_text.lower()

    jd_skills = [s for s in KNOWN_SKILLS if s in jd_lower]
    matched   = [s for s in jd_skills if s in resume_lower]
    missing   = [s for s in jd_skills if s not in resume_lower]

    return matched, missing


def get_eligibility_message(score: float) -> str:
    if score >= 0.7:
        return "Excellent match! You are well suited for this role."
    elif score >= 0.55:
        return "Good match. You meet most requirements for this role."
    elif score >= 0.45:
        return "Moderate match. Consider strengthening missing skills."
    else:
        return "Low match. We recommend upskilling before attempting this interview."