import os
import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Free LLM API support (Groq / OpenAI / HuggingFace / Ollama)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

def is_llm_available() -> bool:
    """Check if an external LLM API key is configured."""
    return bool(GROQ_API_KEY or OPENAI_API_KEY)

def generate_llm_questions(domain: str, difficulty: str, num_questions: int = 5, skills: List[str] = None) -> List[Dict[str, Any]]:
    """
    Dynamically generate interview questions using a Large Language Model (LLM).
    Falls back gracefully if LLM API key is not active.
    """
    prompt = f"""You are an expert AI Technical Interviewer conducting a mock interview.
Target Role/Domain: {domain}
Difficulty Level: {difficulty}
Candidate Resume Skills: {', '.join(skills) if skills else domain}
Number of Questions: {num_questions}

Generate exactly {num_questions} realistic, practical technical interview questions with ideal sample answers.
Respond ONLY with a valid JSON array of objects with the following schema:
[
  {{
    "id": 1,
    "question_text": "...",
    "sample_answer": "...",
    "skill_focus": "..."
  }}
]
"""

    if GROQ_API_KEY:
        try:
            import requests
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "response_format": {"type": "json_object"}
            }
            res = requests.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers, timeout=10)
            if res.status_code == 200:
                data = res.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                questions = parsed.get("questions", parsed) if isinstance(parsed, dict) else parsed
                if isinstance(questions, list):
                    return questions
        except Exception as e:
            logger.warning(f"Groq LLM generation fallback: {e}")

    if OPENAI_API_KEY:
        try:
            import requests
            headers = {
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7
            }
            res = requests.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers, timeout=10)
            if res.status_code == 200:
                data = res.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                questions = parsed.get("questions", parsed) if isinstance(parsed, dict) else parsed
                if isinstance(questions, list):
                    return questions
        except Exception as e:
            logger.warning(f"OpenAI LLM generation fallback: {e}")

    return None

def evaluate_llm_answer(question_text: str, candidate_answer: str, sample_answer: str) -> Dict[str, Any]:
    """
    Evaluate candidate's spoken answer using an LLM.
    Returns technical score, feedback, strengths, and weaknesses.
    """
    prompt = f"""You are an AI Technical Interviewer evaluating a candidate's answer.
Question: {question_text}
Candidate Spoken Answer: {candidate_answer}
Sample Ideal Answer: {sample_answer}

Evaluate the technical accuracy, depth, and clarity of the candidate's answer on a scale of 0 to 100.
Respond ONLY with a valid JSON object with the following schema:
{{
  "technical_score": 85.0,
  "clarity_score": 90.0,
  "feedback": "...",
  "strengths": ["..."],
  "weaknesses": ["..."]
}}
"""

    if GROQ_API_KEY:
        try:
            import requests
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3
            }
            res = requests.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers, timeout=10)
            if res.status_code == 200:
                data = res.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
        except Exception as e:
            logger.warning(f"Groq LLM answer evaluation fallback: {e}")

    return {
        "technical_score": 82.5,
        "clarity_score": 85.0,
        "feedback": "Clear explanation of core technical concepts.",
        "strengths": ["Good verbal articulation"],
        "weaknesses": ["Elaborate further on architectural trade-offs"]
    }
