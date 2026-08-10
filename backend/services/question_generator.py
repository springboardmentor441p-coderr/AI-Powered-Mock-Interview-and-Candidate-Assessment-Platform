"""
services/question_generator.py — Generate interview questions using OpenAI GPT

For each session, GPT generates 8-10 questions tailored to:
  - Candidate's resume skills
  - Interview type (Technical / HR / Behavioral / Aptitude)
  - Domain (Web Dev / AI-ML / Finance / Core CS)
  - Difficulty level
"""
import os, json

def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key or api_key.startswith("sk-your"):
        return None
    try:
        from openai import OpenAI
        return OpenAI(api_key=api_key)
    except Exception as e:
        print(f"[QuestionGen] Error initializing OpenAI client: {e}")
        return None



SYSTEM_PROMPT = """You are an expert interviewer AI for SmartHire AI platform.
Generate interview questions that are realistic, specific, and matched to the candidate's background.
Always respond with valid JSON only — no extra text."""


def build_prompt(
    skills: list[str],
    interview_type: str,
    domain: str,
    difficulty: str,
    num_questions: int = 8,
) -> str:
    skill_str = ", ".join(skills[:10]) if skills else "general skills"
    return f"""
Generate {num_questions} interview questions for a candidate with skills in: {skill_str}

Interview type: {interview_type}
Domain: {domain}
Difficulty: {difficulty}

Rules:
- For Technical: ask about code, architecture, debugging, algorithms
- For HR: ask about experience, career goals, team situations
- For Behavioral: use STAR format triggers (Tell me about a time...)
- For Aptitude: logical reasoning, problem solving scenarios
- Hard questions should probe deep understanding
- Easy questions should test fundamentals

Return JSON array:
[
  {{
    "question_number": 1,
    "question_text": "...",
    "expected_keywords": ["keyword1", "keyword2", "keyword3"],
    "question_type": "{interview_type}"
  }},
  ...
]
"""


def generate_questions(
    skills: list[str],
    interview_type: str,
    domain: str,
    difficulty: str,
    num_questions: int = 8,
) -> list[dict]:
    """
    Call OpenAI to generate questions.
    Returns list of question dicts.
    Falls back to default questions if API fails.
    """
    client = get_openai_client()
    if not client:
        return _fallback_questions(interview_type, num_questions)

    try:
        prompt = build_prompt(skills, interview_type, domain, difficulty, num_questions)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.7,
            max_tokens=2000,
        )
        raw = response.choices[0].message.content
        # Clean up markdown code blocks if present
        if raw.startswith("```json"):
            raw = raw[7:]
        if raw.startswith("```"):
            raw = raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        questions = json.loads(raw.strip())
        return questions

    except Exception as e:
        print(f"[QuestionGen] OpenAI error: {e} — using fallback questions")
        return _fallback_questions(interview_type, num_questions)


def _fallback_questions(interview_type: str, n: int) -> list[dict]:
    """Used when OpenAI is unavailable (no API key, rate limit, etc.)"""
    bank = {
        "Technical": [
            "Explain the difference between REST and GraphQL APIs.",
            "What is a Python decorator and when would you use one?",
            "How does indexing improve database query performance?",
            "What is the difference between synchronous and asynchronous programming?",
            "Explain what Docker does and why it is useful.",
            "What is JWT and how does authentication work with it?",
            "Describe the MVC pattern and its advantages.",
            "How would you optimize a slow SQL query?",
        ],
        "HR": [
            "Tell me about yourself and your background.",
            "Why are you interested in this role?",
            "Where do you see yourself in five years?",
            "Describe your greatest professional achievement.",
            "How do you handle working under tight deadlines?",
            "What motivates you most in your work?",
            "How do you prioritize when you have multiple tasks?",
            "Why are you leaving your current role?",
        ],
        "Behavioral": [
            "Tell me about a time you handled a conflict in your team.",
            "Describe a situation where you had to learn something quickly.",
            "Give an example of a time you failed and what you learned.",
            "Tell me about a project you led and its outcome.",
            "Describe a time you disagreed with your manager.",
            "Give an example of going above and beyond at work.",
            "Tell me about a time you improved a process.",
            "Describe how you handled a difficult client or stakeholder.",
        ],
        "Aptitude": [
            "If a train travels 60 km/h for 2 hours, how far does it go?",
            "Find the next number in the series: 2, 6, 12, 20, 30, ?",
            "A room has 4 walls. Each wall has a window. How many windows total?",
            "If 5 machines make 5 products in 5 minutes, how long for 100 machines to make 100 products?",
            "What comes next: Monday, Wednesday, Friday, ?",
            "A clock shows 3:15. What is the angle between the hands?",
            "If all roses are flowers and some flowers fade quickly, can we say some roses fade quickly?",
            "Two pipes fill a tank in 3 and 4 hours respectively. How long together?",
        ],
    }
    questions_for_type = bank.get(interview_type, bank["Technical"])
    return [
        {
            "question_number": i + 1,
            "question_text": questions_for_type[i % len(questions_for_type)],
            "expected_keywords": [],
            "question_type": interview_type,
        }
        for i in range(n)
    ]
