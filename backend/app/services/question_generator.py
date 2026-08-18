"""
AI-driven interview question generation.

Template + skill-conditioned generator (offline, deterministic). To upgrade to
generative LLM questions in production, replace `generate_questions` with a
call to your model of choice, keeping the same return shape.
"""
import random
from typing import List, Optional

HR_QUESTIONS = [
    "Tell me about yourself and your career journey so far.",
    "Why do you want to work for our company?",
    "Where do you see yourself in five years?",
    "Describe a time you disagreed with a manager. How did you handle it?",
    "What are your greatest strengths and weaknesses?",
    "Why should we hire you over other candidates?",
    "How do you handle stress and tight deadlines?",
    "What motivates you at work?",
]

BEHAVIORAL_QUESTIONS = [
    "Describe a situation where you had to work with a difficult teammate.",
    "Tell me about a time you failed and what you learned from it.",
    "Give an example of a goal you set and how you achieved it.",
    "Describe a time you had to make a decision without all the information.",
    "Tell me about a time you went above and beyond for a project.",
    "Describe a situation where you had to persuade someone to see your point of view.",
]

APTITUDE_QUESTIONS = [
    "If a train travels 60 km in 45 minutes, what is its speed in km/h?",
    "A shopkeeper marks up an item by 20% and then gives a 10% discount. What is the net profit percentage?",
    "Find the next number in the sequence: 2, 6, 12, 20, 30, ?",
    "If 5 machines take 5 minutes to make 5 widgets, how long would 100 machines take to make 100 widgets?",
    "A is twice as efficient as B. Together they finish a task in 6 days. How long would A take alone?",
]

TECHNICAL_BANK = {
    "python": [
        "Explain the difference between a list and a tuple in Python.",
        "What are Python decorators and when would you use one?",
        "How does Python's garbage collection work?",
    ],
    "javascript": [
        "Explain the difference between '==' and '===' in JavaScript.",
        "What is a closure in JavaScript? Give an example use case.",
        "Explain the event loop and how asynchronous code executes in JS.",
    ],
    "react": [
        "Explain the difference between state and props in React.",
        "What are React hooks and why were they introduced?",
        "How does the virtual DOM improve rendering performance?",
    ],
    "sql": [
        "What is the difference between INNER JOIN and LEFT JOIN?",
        "Explain database normalization and why it matters.",
        "What is an index and how does it affect query performance?",
    ],
    "system design": [
        "How would you design a URL shortening service?",
        "Explain how you would design a scalable notification system.",
        "What is the CAP theorem and how does it apply to distributed systems?",
    ],
    "machine learning": [
        "Explain the bias-variance tradeoff.",
        "What is the difference between supervised and unsupervised learning?",
        "How would you handle an imbalanced dataset?",
    ],
    "docker": [
        "What is the difference between a Docker image and a container?",
        "Explain the purpose of a Dockerfile and docker-compose.yml.",
    ],
    "data structures": [
        "Explain the difference between a stack and a queue, with a real-world use case.",
        "When would you use a hash map over a binary search tree?",
    ],
    "algorithms": [
        "Explain the time complexity of quicksort in the average and worst case.",
        "How would you detect a cycle in a linked list?",
    ],
    "general": [
        "Walk me through how you would approach debugging a production issue.",
        "Explain a technically challenging project you've worked on and your role in it.",
        "How do you keep your technical skills up to date?",
    ],
}

DIFFICULTY_NOTE = {
    "easy": " (Keep your answer concise and focus on the fundamentals.)",
    "medium": "",
    "hard": " (Provide a detailed, in-depth answer with trade-offs and edge cases.)",
}

# Maps common job titles to a relevant technical domain + implied skill set,
# used to steer AI-generated interview questions toward the role applied for.
JOB_TITLE_MAP = {
    "ai engineer": {"domain": "machine learning", "skills": ["python", "machine learning", "system design"]},
    "ml engineer": {"domain": "machine learning", "skills": ["python", "machine learning", "system design"]},
    "machine learning engineer": {"domain": "machine learning", "skills": ["python", "machine learning"]},
    "data scientist": {"domain": "machine learning", "skills": ["python", "machine learning", "sql"]},
    "frontend developer": {"domain": "react", "skills": ["javascript", "react", "html", "css"]},
    "front end developer": {"domain": "react", "skills": ["javascript", "react", "html", "css"]},
    "react developer": {"domain": "react", "skills": ["javascript", "react"]},
    "backend developer": {"domain": "system design", "skills": ["python", "sql", "system design"]},
    "back end developer": {"domain": "system design", "skills": ["python", "sql", "system design"]},
    "full stack developer": {"domain": "system design", "skills": ["javascript", "react", "python", "sql"]},
    "software engineer": {"domain": "data structures", "skills": ["data structures", "algorithms", "system design"]},
    "devops engineer": {"domain": "docker", "skills": ["docker", "system design"]},
    "data engineer": {"domain": "sql", "skills": ["sql", "python", "system design"]},
    "product manager": {"domain": "general", "skills": ["communication", "problem solving"]},
    "qa engineer": {"domain": "general", "skills": ["problem solving"]},
    "sde": {"domain": "data structures", "skills": ["data structures", "algorithms"]},
}


def resolve_job_title(job_title: Optional[str]) -> dict:
    """Best-effort match of a free-text job title to a known domain/skill profile."""
    if not job_title:
        return {"domain": "general", "skills": []}
    key = job_title.strip().lower()
    if key in JOB_TITLE_MAP:
        return JOB_TITLE_MAP[key]
    for known, profile in JOB_TITLE_MAP.items():
        if known in key or key in known:
            return profile
    return {"domain": "general", "skills": []}


def generate_next_question(
    interview_type: str,
    difficulty: str,
    domain: str,
    skills: Optional[List[str]],
    exclude_texts: List[str],
    order_index: int,
) -> dict:
    """Generate a single adaptive question, avoiding repeats already asked in this session."""
    batch = generate_questions(interview_type, difficulty, domain, skills, num_questions=10)
    for q in batch:
        base_text = q["question_text"].split(" (")[0]
        if base_text not in [e.split(" (")[0] for e in exclude_texts]:
            q["order_index"] = order_index
            return q
    # fallback: all exhausted, recycle with a note
    fallback = batch[0] if batch else {"question_text": "Tell me more about a recent project you're proud of.", "category": "HR"}
    fallback["order_index"] = order_index
    return fallback


def _pick_technical_questions(domain: str, skills: Optional[List[str]], n: int) -> List[str]:
    pool = []
    keys = []
    if skills:
        keys.extend([s for s in skills if s in TECHNICAL_BANK])
    if domain and domain.lower() in TECHNICAL_BANK:
        keys.append(domain.lower())
    if not keys:
        keys = ["general"]
    keys = list(dict.fromkeys(keys))  # de-dup, preserve order

    for k in keys:
        pool.extend(TECHNICAL_BANK[k])
    pool.extend(TECHNICAL_BANK["general"])

    random.shuffle(pool)
    # de-dup while preserving order
    seen = set()
    unique_pool = []
    for q in pool:
        if q not in seen:
            unique_pool.append(q)
            seen.add(q)
    return unique_pool[:n]


def generate_questions(
    interview_type: str,
    difficulty: str = "medium",
    domain: str = "general",
    skills: Optional[List[str]] = None,
    num_questions: int = 5,
) -> List[dict]:
    interview_type = interview_type.lower()
    note = DIFFICULTY_NOTE.get(difficulty.lower(), "")

    if interview_type == "hr":
        bank = HR_QUESTIONS[:]
        random.shuffle(bank)
        selected = bank[:num_questions]
        category = "HR"
    elif interview_type == "behavioral":
        bank = BEHAVIORAL_QUESTIONS[:]
        random.shuffle(bank)
        selected = bank[:num_questions]
        category = "Behavioral"
    elif interview_type == "aptitude":
        bank = APTITUDE_QUESTIONS[:]
        random.shuffle(bank)
        selected = bank[:num_questions]
        category = "Aptitude"
    else:  # technical
        selected = _pick_technical_questions(domain, skills, num_questions)
        category = "Technical"

    return [
        {"order_index": i + 1, "question_text": q + note, "category": category}
        for i, q in enumerate(selected)
    ]
