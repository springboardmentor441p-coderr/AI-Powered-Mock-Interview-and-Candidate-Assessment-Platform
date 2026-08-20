"""Deterministic interview intelligence.

This service is deliberately isolated from HTTP and persistence so an approved
LLM provider can replace the generators later without changing the interview API.
"""
import re
from pathlib import Path

from pypdf import PdfReader

SKILL_CATALOG = {
    "Python": ["python", "django", "fastapi", "flask"],
    "Java": ["java", "spring boot", "spring"],
    "JavaScript": ["javascript", "typescript", "node.js", "nodejs"],
    "React": ["react", "reactjs", "react.js", "next.js"],
    "SQL": ["sql", "mysql", "postgresql", "mongodb"],
    "Docker": ["docker", "kubernetes"],
    "AWS": ["aws", "amazon web services", "ec2", "s3"],
    "DevOps": ["devops", "ci/cd", "jenkins", "terraform", "ansible"],
    "Mobile Development": ["flutter", "dart", "react native", "android", "ios"],
    "HTML/CSS": ["html", "css", "bootstrap", "tailwind"],
    "Machine Learning": ["machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn", "swin transformer", "cnn"],
    "Data Analysis": ["pandas", "numpy", "power bi", "tableau", "data analysis"],
    "Git": ["git", "github", "gitlab"],
}
ROLE_KEYWORDS = {
    "Machine Learning Engineer": ("machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn", "random forest", "xgboost", "cnn"),
    "Frontend Developer": ("react", "javascript", "typescript", "html", "css", "tailwind", "next.js"),
    "Backend Developer": ("spring boot", "fastapi", "django", "flask", "java", "postgresql", "mysql", "rest api"),
    "DevOps Engineer": ("docker", "kubernetes", "terraform", "jenkins", "ci/cd", "devops", "ansible"),
    "Mobile App Developer": ("flutter", "dart", "react native", "android", "ios"),
    "Data Analyst": ("power bi", "tableau", "excel", "pandas", "numpy", "data analysis", "sql"),
}
GENERAL_TOPICS = {
    "Frontend Developer": ["component state", "rendering performance", "responsive layout", "accessibility", "API integration"],
    "Backend Developer": ["API design", "data modelling", "authentication", "error handling", "service reliability"],
    "Python Developer": ["Python design", "testing", "data structures", "API development", "debugging"],
    "Machine Learning Engineer": ["model selection", "data quality", "model evaluation", "deployment", "model monitoring"],
    "Data Analyst": ["data cleaning", "SQL analysis", "business metrics", "data visualisation", "stakeholder communication"],
    "Cloud Engineer": ["cloud architecture", "deployment automation", "container orchestration", "security", "reliability"],
    "DevOps Engineer": ["delivery pipelines", "container orchestration", "infrastructure automation", "observability", "release reliability"],
    "Mobile App Developer": ["application state", "responsive mobile layout", "network reliability", "platform integration", "release quality"],
    "HR Associate": ["candidate experience", "structured interviewing", "stakeholder communication", "conflict resolution", "process improvement"],
}
MEANINGLESS_RESPONSES = {"hi", "hello", "okay", "ok", "yes", "no", "nothing", "none", "na", "n/a", "...", "idk", "i don't know", "dont know"}


def extract_pdf_text(path: Path) -> str:
    try:
        reader = PdfReader(str(path))
        return "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    except Exception:
        return ""


def _normalise(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def question_identity(question: str) -> str:
    """Canonical form used to stop exact duplicate interviewer questions."""
    return re.sub(r"[^a-z0-9+# ]", "", _normalise(question)).strip()


def questions_are_similar(first: str, second: str) -> bool:
    """Conservatively catch reworded versions of the same question."""
    if question_identity(first) == question_identity(second):
        return True
    ignored = {"you", "your", "what", "would", "could", "should", "about", "that", "this", "with", "from", "have", "been", "next", "tell", "describe", "mention", "mentioned"}
    terms = lambda value: {word for word in re.findall(r"[a-z][a-z+#-]{2,}", value.lower()) if word not in ignored}
    first_terms, second_terms = terms(first), terms(second)
    if not first_terms or not second_terms:
        return False
    return len(first_terms & second_terms) / len(first_terms | second_terms) >= 0.7


def detect_skills(text: str) -> list[str]:
    normalised = _normalise(text)
    found = []
    for skill, keywords in SKILL_CATALOG.items():
        if any(re.search(rf"(?<!\w){re.escape(word)}(?!\w)", normalised) for word in keywords):
            found.append(skill)
    return found


def _section_lines(text: str, headings: tuple[str, ...]) -> list[str]:
    lines = [line.strip("•*- \t") for line in text.splitlines() if line.strip()]
    output, collecting = [], False
    for line in lines:
        heading = _normalise(line).rstrip(":")
        if any(heading == name or heading.startswith(name + " ") for name in headings):
            collecting = True
            continue
        if collecting and re.fullmatch(r"[A-Za-z][A-Za-z &/]{2,35}:?", line):
            break
        if collecting:
            output.append(line)
    return output


def _unique(values: list[str], limit: int = 5) -> list[str]:
    result = []
    for value in values:
        cleaned = re.sub(r"\s+", " ", value).strip(" .,:;-")
        if cleaned and cleaned.lower() not in {item.lower() for item in result}:
            result.append(cleaned)
        if len(result) >= limit:
            break
    return result


def suggest_role(text: str, skills: list[str]) -> str:
    """Rank roles using resume evidence instead of a fixed default role."""
    corpus = _normalise(text + " " + " ".join(skills))
    scores = {role: sum(1 for keyword in keywords if keyword in corpus) for role, keywords in ROLE_KEYWORDS.items()}
    best_role, best_score = max(scores.items(), key=lambda item: item[1])
    if best_score:
        return best_role
    if "Python" in skills or "Java" in skills:
        return "Backend Developer"
    return "Software Developer"


def extract_resume_context(text: str) -> dict:
    """Extract a structured, auditable profile from a text-based PDF resume."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    name = next((line for line in lines[:5] if re.fullmatch(r"[A-Za-z][A-Za-z .'-]{2,80}", line) and "resume" not in line.lower()), "")
    skills = detect_skills(text)
    technology_terms = re.findall(r"\b(?:React|Node\.js|TypeScript|JavaScript|Python|Java|SQL|PostgreSQL|MySQL|MongoDB|Docker|Kubernetes|AWS|TensorFlow|PyTorch|Pandas|NumPy|FastAPI|Flask|Django|Spring Boot|Git|GitHub|Linux)\b", text, re.I)
    project_lines = _section_lines(text, ("projects", "project", "academic projects", "personal projects"))
    project_fallback = re.findall(r"(?:built|developed|created|implemented)\s+(?:an?\s+)?([A-Z][A-Za-z0-9 .&-]{3,70})", text, re.I)
    projects = _unique(project_lines + project_fallback, 4)
    experience_lines = _section_lines(text, ("experience", "work experience", "professional experience", "internships", "internship"))
    education = _unique(_section_lines(text, ("education", "academic background")), 3)
    certifications = _unique(_section_lines(text, ("certifications", "certification", "licenses")), 4)
    duration_matches = re.findall(r"\b(?:\d+(?:\.\d+)?\+?\s*(?:years?|yrs?)|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{4}\s*[-–]\s*(?:present|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{4}))\b", text, re.I)
    experience = duration_matches[0] if duration_matches else (experience_lines[0] if experience_lines else "")
    domain = "software engineering"
    if "Machine Learning" in skills: domain = "machine learning"
    elif "Data Analysis" in skills: domain = "data analytics"
    elif "Mobile Development" in skills: domain = "mobile development"
    elif "DevOps" in skills: domain = "DevOps"
    elif "React" in skills or "HTML/CSS" in skills: domain = "web development"
    elif "AWS" in skills or "Docker" in skills: domain = "cloud engineering"
    return {
        "candidate_name": name, "skills": skills, "programming_languages": [item for item in skills if item in {"Python", "Java", "JavaScript", "SQL"}],
        "frameworks": [item for item in skills if item in {"React", "Machine Learning"}],
        "projects": projects, "experience": experience, "internships": _unique(_section_lines(text, ("internships", "internship")), 3),
        "education": education, "certifications": certifications, "tools": _unique(technology_terms, 12),
        "technologies": _unique(technology_terms, 12), "domain": domain, "suggested_role": suggest_role(text, skills),
    }


def _level_modifier(difficulty: str) -> str:
    return {"Beginner": "in clear, practical terms", "Advanced": "including trade-offs, risks, and validation", "Intermediate": "with a concrete example and outcome"}.get(difficulty, "with a concrete example and outcome")


def generate_questions(skills: list[str], has_resume_text: bool, role_title: str = "your target role", context: dict | None = None, difficulty: str = "Intermediate", experience_level: str = "") -> list[str]:
    """Generate only the opening question; later questions are conversational."""
    context = context or {}
    modifier = _level_modifier(difficulty)
    if has_resume_text:
        project = (context.get("projects") or context.get("technologies") or skills or ["your resume project"])[0]
        technologies = context.get("technologies") or skills or [project]
        primary = technologies[0]
        technology_question = (
            f"Why did you choose {primary} for {project}?" if difficulty == "Beginner" else
            f"How did you implement {primary} in {project}?" if difficulty == "Intermediate" else
            f"What trade-offs did you evaluate when using {primary} in {project}?"
        )
        return [f"Tell me about {project}."]
    else:
        topics = GENERAL_TOPICS.get(role_title, GENERAL_TOPICS["Backend Developer"])
        return [f"Tell me about yourself as a {role_title}."]


def _terms(value: str) -> set[str]:
    ignored = {"with", "that", "this", "about", "your", "have", "from", "what", "when", "were", "where", "would", "could", "their", "there"}
    return {word for word in re.findall(r"[a-zA-Z][a-zA-Z+#.-]{2,}", value.lower()) if word not in ignored}


def is_meaningful_answer(answer: str) -> bool:
    compact = _normalise(answer).strip(" .!?")
    return len(compact.split()) >= 4 and compact not in MEANINGLESS_RESPONSES and len(_terms(compact)) >= 3


def evaluate_answer(question: str, answer: str, skills: list[str] | None = None) -> dict:
    answer = (answer or "").strip()
    words = answer.split()
    if not is_meaningful_answer(answer):
        return {"score": 0, "relevance": 0, "technical_correctness": 0, "completeness": 0, "communication": 0, "confidence": 0, "examples": 0, "feedback": "No meaningful answer was provided, so this response was not evaluated.", "suggested_better_answer": "Give a practical example: explain the context, your action, the relevant technical decision, and the result."}
    answer_terms, question_terms = _terms(answer), _terms(question)
    skill_terms = _terms(" ".join(skills or []))
    overlap = len(answer_terms & (question_terms | skill_terms))
    has_example = bool(re.search(r"\b(for example|for instance|i built|i developed|i implemented|project|result|improved|reduced|increased)\b", answer, re.I))
    has_structure = bool(re.search(r"\b(situation|task|challenge|action|approach|result|outcome)\b", answer, re.I))
    has_technical_detail = bool(answer_terms & skill_terms) or bool(re.search(r"\b(api|database|algorithm|testing|deploy|architecture|debug|performance|model|query)\b", answer, re.I))
    relevance = min(100, 20 + overlap * 18 + (20 if has_example else 0))
    technical = min(100, 15 + (45 if has_technical_detail else 0) + (20 if len(words) >= 35 else 0))
    completeness = min(100, 10 + min(50, len(words)) + (25 if has_structure else 0) + (15 if has_example else 0))
    communication = min(100, 30 + min(40, len(words) // 2) + (15 if re.search(r"[.!?]", answer) else 0))
    confidence = max(10, min(100, 45 + (20 if re.search(r"\b(i led|i delivered|i improved|i solved|i designed)\b", answer, re.I) else 0) - (15 if re.search(r"\b(maybe|i think|not sure|probably)\b", answer, re.I) else 0)))
    examples = 85 if has_example and len(words) >= 20 else (35 if has_example else 10)
    score = round(relevance * .22 + technical * .23 + completeness * .20 + communication * .15 + confidence * .10 + examples * .10)
    # A short response cannot earn an impressive score merely by containing a keyword.
    if len(words) < 10:
        score = min(score, 20)
    elif len(words) < 20:
        score = min(score, 40)
    feedback = "You connected your answer to a concrete example and a technical decision." if has_example and has_technical_detail else "Strengthen this by naming your approach, personal contribution, and measurable outcome."
    return {"score": score, "relevance": relevance, "technical_correctness": technical, "completeness": completeness, "communication": communication, "confidence": confidence, "examples": examples, "feedback": feedback, "suggested_better_answer": "Use STAR: situation, task, action, and result. Include one technical decision, why you chose it, and the measured outcome."}


CATEGORY_LABELS = {
    "communication": "Communication",
    "technical_knowledge": "Technical relevance",
    "confidence": "Confidence",
    "problem_solving": "Problem-solving / completeness",
}


def derive_strengths_and_weaknesses(feedback: dict) -> tuple[list[str], list[str]]:
    """Turn real per-category averages into strengths/weaknesses. No fixed/fake text."""
    strengths, weaknesses = [], []
    for key, label in CATEGORY_LABELS.items():
        value = feedback.get(key)
        if value is None:
            continue
        if value >= 70:
            strengths.append(f"{label} is a strength ({value}/100 average).")
        elif value < 55:
            weaknesses.append(f"{label} needs improvement ({value}/100 average).")
    if not strengths and feedback.get("score") is not None:
        strengths.append("You completed the interview with meaningful, evaluated responses.")
    if not weaknesses:
        weaknesses.append("No significant weak areas were detected in this interview.")
    return strengths, weaknesses


def _history_text(history: list[dict] | None) -> str:
    return " ".join(f"{item.get('question', '')} {item.get('answer', '')}" for item in (history or []))


def _first_unexplored(values: list[str], history_text: str) -> str:
    normalised_history = _normalise(history_text)
    return next((value for value in values if _normalise(value) not in normalised_history), values[0] if values else "")


def _answer_focus(answer: str, technologies: list[str], skills: list[str]) -> str:
    """Find the concrete method or technology in the candidate's latest answer."""
    corpus = _normalise(answer)
    if "flask" in corpus and ("api" in corpus or "endpoint" in corpus):
        return "the Flask backend and API communication"
    explicit_technology = next((item for item in technologies + skills if _normalise(item) in corpus), "")
    if explicit_technology:
        return explicit_technology
    known_methods = ("random forest", "xgboost", "swin transformer", "neural network", "convolutional neural network", "cnn", "rest api", "api", "flask", "microservice", "virtual dom", "flexbox", "grid")
    match = next((item for item in known_methods if item in corpus), "")
    if match:
        return match
    return ""


def generate_follow_up(previous_question: str, answer: str, skills: list[str], role_title: str, difficulty: str = "Intermediate", context: dict | None = None, history: list[dict] | None = None) -> str:
    """Generate a natural fallback from the candidate's answer, never raw metadata."""
    context = context or {}
    technologies = _unique(list(context.get("technologies") or []) + list(skills), 12)
    mentioned = _answer_focus(answer, technologies, skills)
    turn = len(history or [])

    # Only a topic found in the latest answer may be attributed to the candidate.
    if mentioned:
        if turn <= 1:
            candidate = f"You mentioned {mentioned}. What made that challenging, and how did you handle it?"
        elif turn == 2:
            candidate = f"How did you test or measure the result of {mentioned}?"
        elif turn == 3:
            candidate = f"What was the most difficult issue involving {mentioned}?"
        else:
            candidate = f"You mentioned {mentioned}. What would you improve or scale next?"
    elif turn <= 1:
        candidate = "That's great to hear. Could you briefly introduce yourself and tell me a little about your background?"
    elif turn == 2:
        candidate = f"Could you tell me about a project or experience most relevant to your {role_title} goals?"
    elif turn == 3:
        candidate = "What was a challenging problem you faced, and how did you work through it?"
    else:
        candidate = "What would you improve or scale next in a project you have worked on?"

    asked = [item.get("question", "") for item in (history or [])]
    alternatives = [
        candidate,
        f"Let's switch focus. Could you describe a decision you made that is relevant to a {role_title} role?",
        "What trade-off did you have to consider while solving a problem?",
        "Could you share an example of how you collaborated with others to resolve a challenge?",
        "How would you approach a similar problem differently next time?",
    ]
    for option in alternatives:
        if not any(questions_are_similar(option, prior) for prior in asked):
            return option
    return "Could you describe a different project or experience that demonstrates your problem-solving approach?"


def practice_feedback(questions, skills: list[str] | None = None, total_questions: int | None = None) -> dict:
    answered = [item for item in questions if item.answer_text and is_meaningful_answer(item.answer_text)]
    evaluations = [evaluate_answer(item.question, item.answer_text or "", skills) for item in answered]
    configured_total = total_questions if total_questions is not None else len(questions)
    if len(answered) != len(questions):
        return {"score": None, "answered_questions": len(answered), "total_questions": configured_total, "strengths": [], "improvements": [], "note": "Interview Incomplete. Complete every question with a meaningful answer to receive feedback.", "communication": 0, "technical_knowledge": 0, "confidence": 0, "problem_solving": 0, "recommended_topics": [], "question_breakdown": []}
    score = round(sum(item["score"] for item in evaluations) / len(evaluations)) if evaluations else 0
    averages = {key: round(sum(item[key] for item in evaluations) / len(evaluations)) if evaluations else 0 for key in ("communication", "technical_correctness", "confidence", "completeness")}
    strengths = ["You completed every question with a meaningful response."]
    if score >= 70: strengths.append("Your answers connected relevant detail to practical examples.")
    improvements = ["Use the STAR method to make each response easier to follow.", "Name the technical decision you made and quantify the outcome where possible."]
    topics = list((skills or [])[:3]) or ["structured interviewing", "technical communication"]
    return {"score": score, "answered_questions": len(answered), "total_questions": configured_total, "strengths": strengths, "improvements": improvements, "note": "Practice feedback is generated from a transparent answer-quality rubric; it is not an employment decision.", "communication": averages["communication"], "technical_knowledge": averages["technical_correctness"], "confidence": averages["confidence"], "problem_solving": averages["completeness"], "recommended_topics": topics, "question_breakdown": [{"question": question.question, "answer": question.answer_text or "", **evaluation} for question, evaluation in zip(answered, evaluations)]}
