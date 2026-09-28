"""
Generates interview questions using OpenAI GPT.
Falls back to a hardcoded question bank if no API key is set.
"""
import json
import os
from typing import Optional

OPENAI_KEY = os.getenv("OPENAI_API_KEY", "")


QUESTION_BANK = {
    "Technical": {
        "Web development": [
            "Explain how React's virtual DOM works and why it improves performance.",
            "What is the difference between REST and GraphQL? When would you pick each?",
            "How does async/await work in Python? Give a real example.",
            "What is CORS and how do you configure it in FastAPI?",
            "Explain the difference between authentication and authorization.",
            "What are database indexes and when should you add them?",
            "Describe how JWT tokens work end-to-end in a web app.",
            "What is the difference between SQL and NoSQL databases?",
            "How would you optimize a slow API endpoint?",
            "Explain Docker and why it's useful for deployment.",
        ],
        "AI / ML": [
            "What is the difference between supervised and unsupervised learning?",
            "Explain what overfitting is and how you prevent it.",
            "How does a neural network learn using backpropagation?",
            "What is the difference between a CNN and an RNN?",
            "Explain the transformer architecture in simple terms.",
            "What metrics would you use to evaluate a classification model?",
            "How do you handle class imbalance in a dataset?",
            "What is transfer learning and when would you use it?",
            "Explain the bias-variance tradeoff.",
            "How would you deploy an ML model to production?",
        ],
        "Core CS": [
            "Explain the time complexity of binary search.",
            "What is the difference between a stack and a queue?",
            "How does garbage collection work in Python?",
            "What is a hash table and how does it handle collisions?",
            "Explain the difference between processes and threads.",
            "What are SOLID principles? Give an example of the Single Responsibility Principle.",
            "What is a deadlock and how can you prevent it?",
            "Explain polymorphism with an example.",
            "What is the difference between TCP and UDP?",
            "How does a relational database enforce ACID properties?",
        ],
        "Finance": [
            "Explain the time value of money.",
            "What is the difference between NPV and IRR?",
            "How do you value a company using DCF?",
            "What is a balance sheet and what does it show?",
            "Explain what derivatives are with a simple example.",
            "What are the risks of high financial leverage?",
            "How does inflation affect investment returns?",
            "What is the difference between equity and debt financing?",
            "Explain what a P/E ratio tells you about a stock.",
            "What is credit risk and how is it measured?",
        ],
    },
    "HR": {
        "default": [
            "Tell me about yourself and your background.",
            "Why are you interested in this role?",
            "Where do you see yourself in 5 years?",
            "What is your greatest professional strength?",
            "Describe a challenge you faced at work and how you resolved it.",
            "How do you handle working under tight deadlines?",
            "What motivates you to do your best work?",
            "Why are you leaving your current position?",
            "What salary range are you expecting?",
            "Do you have any questions for us?",
        ]
    },
    "Behavioral": {
        "default": [
            "Tell me about a time you had to work with a difficult teammate.",
            "Describe a situation where you took initiative without being asked.",
            "Give an example of when you failed and what you learned from it.",
            "Tell me about a time you managed multiple priorities at once.",
            "Describe a project where you had to learn something completely new quickly.",
            "Give an example of a time you disagreed with your manager. How did you handle it?",
            "Tell me about a time you went above and beyond for a customer or stakeholder.",
            "Describe a situation where you had to make a decision with incomplete information.",
            "Tell me about a time you mentored or helped a colleague.",
            "Give an example of when you had to adapt to a major change at work.",
        ]
    },
    "Aptitude": {
        "default": [
            "A train travels 120 km in 2 hours. What is its speed in m/s?",
            "If 8 people can complete a task in 6 days, how long will 12 people take?",
            "What is 15% of 480?",
            "A rectangle has length 18 cm and width 12 cm. What is its area?",
            "Two numbers are in ratio 3:5. Their sum is 96. Find the numbers.",
            "If a product is sold at 20% profit for ₹840, what was the cost price?",
            "Arrange these in logical order: Month, Day, Year, Decade, Century.",
            "In a class of 40 students, 60% are girls. How many boys are there?",
            "If A is the brother of B, and B is the sister of C, what is A to C?",
            "Complete the series: 2, 6, 12, 20, 30, __",
        ]
    },
}


def get_questions_from_bank(
    interview_type: str,
    domain: str,
    difficulty: str,
    count: int = 10,
    skills: list[str] | None = None,
) -> list[dict]:
    """
    Returns questions from the hardcoded bank.
    Each item: {"question": str, "expected_keywords": list[str]}
    """
    type_bank = QUESTION_BANK.get(interview_type, QUESTION_BANK["Behavioral"])
    domain_qs = type_bank.get(domain) or type_bank.get("default") or []

    # Build question list
    questions = []
    for i, q in enumerate(domain_qs[:count]):
        questions.append({
            "question_number": i + 1,
            "question_text": q,
            "expected_keywords": _keywords_for(q),
        })
    return questions


def _keywords_for(question: str) -> list[str]:
    """Simple keyword extractor from question text."""
    tech_words = [
        "react","virtual dom","rest","graphql","async","await","cors","jwt","docker",
        "index","sql","nosql","neural","backpropagation","overfitting","transformer",
        "supervised","unsupervised","gradient","bias","variance","classification",
        "hash","stack","queue","deadlock","thread","solid","tcp","udp","acid","garbage",
        "dcf","npv","irr","balance sheet","derivative","leverage","equity","debt",
        "init","scope","closure","promise","middleware","serialization",
    ]
    question_lower = question.lower()
    return [w for w in tech_words if w in question_lower][:5]


async def generate_questions_ai(
    interview_type: str,
    domain: str,
    difficulty: str,
    skills: list[str],
    count: int = 10,
) -> list[dict]:
    """
    Calls OpenAI GPT to generate personalised questions based on candidate skills.
    Falls back to question bank if no API key.
    """
    if not OPENAI_KEY or OPENAI_KEY.startswith("sk-your"):
        # No key — use the local bank
        return get_questions_from_bank(interview_type, domain, difficulty, count, skills)

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=OPENAI_KEY)

        skills_str = ", ".join(skills) if skills else "general software development"
        prompt = f"""You are an expert technical interviewer.
Generate exactly {count} {difficulty.lower()}-difficulty {interview_type} interview questions for a candidate.
Domain: {domain}
Candidate skills: {skills_str}

Rules:
- Questions must be specific to the candidate's skill set
- Mix conceptual and practical questions
- Each question should be answerable in 2-3 minutes verbally

Return ONLY a JSON array. Each item must have:
  "question_text": string
  "expected_keywords": array of 3-5 key terms the ideal answer should contain

Example format:
[
  {{"question_text": "...", "expected_keywords": ["keyword1","keyword2","keyword3"]}}
]"""

        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2000,
        )
        raw = response.choices[0].message.content.strip()
        # Strip markdown code blocks if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
        return [{"question_number": i+1, **q} for i, q in enumerate(data[:count])]

    except Exception as e:
        print(f"OpenAI question gen failed: {e} — falling back to bank")
        return get_questions_from_bank(interview_type, domain, difficulty, count, skills)
