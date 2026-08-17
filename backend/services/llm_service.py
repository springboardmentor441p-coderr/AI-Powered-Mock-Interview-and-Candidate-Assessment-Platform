import os
import json
import logging
from typing import List, Dict, Any, Optional

import requests
from dotenv import load_dotenv

# =========================================================
# ENVIRONMENT SETUP (Load backend/.env or root .env)
# =========================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

ENV_FILE_BACKEND = os.path.join(BASE_DIR, ".env")
ENV_FILE_ROOT = os.path.join(PROJECT_ROOT, ".env")

if os.path.exists(ENV_FILE_BACKEND):
    load_dotenv(ENV_FILE_BACKEND)
elif os.path.exists(ENV_FILE_ROOT):
    load_dotenv(ENV_FILE_ROOT)
else:
    load_dotenv()

# =========================================================
# LOGGING
# =========================================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =========================================================
# LLM CONFIGURATION
# =========================================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()

# Default model MUST be openai/gpt-oss-120b for Groq
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b").strip()
if not GROQ_MODEL:
    GROQ_MODEL = "openai/gpt-oss-120b"

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
OPENAI_URL = "https://api.openai.com/v1/chat/completions"

INTERVIEWER_NAME = "Mira"

# =========================================================
# STATUS
# =========================================================

def is_llm_available() -> bool:
    """Check whether an LLM API key (Groq or OpenAI) is configured."""
    return bool(GROQ_API_KEY or OPENAI_API_KEY)

# =========================================================
# GROQ HELPER
# =========================================================

def _call_groq(prompt: str, temperature: float = 0.7) -> Optional[str]:
    """Send a prompt to Groq using model openai/gpt-oss-120b and return the response."""
    if not GROQ_API_KEY:
        logger.warning("GROQ_API_KEY is not configured.")
        return None

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {
                "role": "system",
                "content": f"You are {INTERVIEWER_NAME}, an expert AI technical interviewer. You conduct realistic professional job interviews.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "temperature": temperature,
        "response_format": {
            "type": "json_object"
        },
    }

    try:
        logger.info("Calling Groq model: %s", GROQ_MODEL)
        response = requests.post(
            GROQ_URL,
            headers=headers,
            json=payload,
            timeout=30,
        )

        logger.info("Groq HTTP status: %s", response.status_code)

        if response.status_code != 200:
            logger.error(
                "Groq API error %s: %s",
                response.status_code,
                response.text[:1500],
            )
            return None

        data = response.json()
        content = data["choices"][0]["message"]["content"]
        return content

    except requests.RequestException as exc:
        logger.error("Groq network error: %s", exc)
        return None
    except Exception as exc:
        logger.exception("Unexpected Groq error: %s", exc)
        return None

# =========================================================
# OPENAI HELPER (Secondary Fallback if configured)
# =========================================================

def _call_openai(prompt: str, temperature: float = 0.7) -> Optional[str]:
    """Send a prompt to OpenAI if configured."""
    if not OPENAI_API_KEY:
        return None

    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": f"You are {INTERVIEWER_NAME}, an expert AI technical interviewer. You conduct realistic professional job interviews.",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "temperature": temperature,
        "response_format": {
            "type": "json_object"
        },
    }

    try:
        logger.info("Calling OpenAI model: gpt-4o-mini")
        response = requests.post(
            OPENAI_URL,
            headers=headers,
            json=payload,
            timeout=30,
        )

        logger.info("OpenAI HTTP status: %s", response.status_code)

        if response.status_code != 200:
            logger.error("OpenAI API error %s: %s", response.status_code, response.text[:1500])
            return None

        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception as exc:
        logger.exception("OpenAI error: %s", exc)
        return None

# =========================================================
# DYNAMIC INTERVIEW QUESTION GENERATION
# =========================================================

def generate_llm_questions(
    domain: str,
    difficulty: str,
    num_questions: int = 5,
    skills: Optional[List[str]] = None,
    previous_question: str = "",
    candidate_answer: str = "",
    resume_text: str = "",
) -> Optional[List[Dict[str, Any]]]:
    """
    Generate dynamic interview questions using Groq LLM (openai/gpt-oss-120b).
    Adapts based on domain, difficulty, resume skills, previous question, and previous answer.
    """
    skills_text = ", ".join(skills) if skills else domain

    prompt = f"""
You are {INTERVIEWER_NAME}, a professional AI interviewer conducting a realistic technical job interview.

Candidate Role: {domain}
Difficulty: {difficulty}
Candidate Skills: {skills_text}
Candidate Resume: {resume_text if resume_text else "No resume provided."}
Previous Question: {previous_question if previous_question else "This is the first question."}
Candidate's Previous Answer: {candidate_answer if candidate_answer else "No previous answer."}
Number of Questions Needed: {num_questions}

Your task:
Generate exactly {num_questions} interview question(s).
The questions must:
1. Be relevant to the candidate's role and domain.
2. Consider candidate skills and resume details.
3. Adapt based on the candidate's previous answer where appropriate.
4. Avoid repeating previous questions.
5. Sound like a real technical interviewer named {INTERVIEWER_NAME}.
6. Be technical and precise.

Return ONLY a valid JSON object in this format:
{{
    "questions": [
        {{
            "id": 1,
            "question_text": "Question content here",
            "sample_answer": "Ideal sample response",
            "skill_focus": "Technical skill tag"
        }}
    ]
}}
"""

    content = _call_groq(prompt, temperature=0.7)
    if content:
        try:
            parsed = json.loads(content)
            if isinstance(parsed, dict):
                questions = parsed.get("questions", [])
                if isinstance(questions, list) and len(questions) > 0:
                    logger.info("%s generated %s question(s) using Groq (%s).", INTERVIEWER_NAME, len(questions), GROQ_MODEL)
                    return questions
        except json.JSONDecodeError as exc:
            logger.error("Groq returned invalid JSON: %s", exc)

    # Fallback to OpenAI if configured
    content = _call_openai(prompt, temperature=0.7)
    if content:
        try:
            parsed = json.loads(content)
            if isinstance(parsed, dict):
                questions = parsed.get("questions", [])
                if isinstance(questions, list) and len(questions) > 0:
                    logger.info("%s generated %s question(s) using OpenAI fallback.", INTERVIEWER_NAME, len(questions))
                    return questions
        except json.JSONDecodeError as exc:
            logger.error("OpenAI returned invalid JSON: %s", exc)

    logger.error("No LLM provider generated valid interview questions.")
    return None

# =========================================================
# EVALUATE CANDIDATE ANSWER VIA GROQ LLM
# =========================================================

def evaluate_llm_answer(
    question_text: str,
    candidate_answer: str,
    sample_answer: str = "",
) -> Dict[str, Any]:
    """
    Evaluate candidate's spoken answer using Groq LLM.
    Returns technical_score, clarity_score, feedback, strengths, weaknesses.
    """
    prompt = f"""
You are {INTERVIEWER_NAME}, an expert AI technical interviewer.

Evaluate the candidate's answer to the technical interview question.

Interview Question:
{question_text}

Candidate Spoken Answer:
{candidate_answer if candidate_answer else "[No spoken answer provided]"}

Ideal Sample Answer Reference:
{sample_answer}

Evaluate technical accuracy, depth, clarity, relevance, and completeness on a scale of 0 to 100.

Return ONLY a valid JSON object:
{{
    "technical_score": 85.0,
    "clarity_score": 90.0,
    "relevance_score": 88.0,
    "completeness_score": 82.0,
    "feedback": "Detailed technical assessment by {INTERVIEWER_NAME}.",
    "strengths": ["Strength point 1", "Strength point 2"],
    "weaknesses": ["Improvement point 1"]
}}
"""

    content = _call_groq(prompt, temperature=0.3)
    if content:
        try:
            result = json.loads(content)
            if isinstance(result, dict):
                logger.info("%s successfully evaluated candidate answer using Groq.", INTERVIEWER_NAME)
                return result
        except json.JSONDecodeError as exc:
            logger.error("Invalid JSON from Groq evaluation: %s", exc)

    content = _call_openai(prompt, temperature=0.3)
    if content:
        try:
            result = json.loads(content)
            if isinstance(result, dict):
                logger.info("%s evaluated candidate answer using OpenAI fallback.", INTERVIEWER_NAME)
                return result
        except json.JSONDecodeError as exc:
            logger.error("Invalid JSON from OpenAI evaluation: %s", exc)

    # Truthful error state when LLM evaluation fails (no fake math.random numbers)
    return {
        "technical_score": 0.0,
        "clarity_score": 0.0,
        "relevance_score": 0.0,
        "completeness_score": 0.0,
        "feedback": "LLM Evaluation Unavailable: Groq API key or network connection issue.",
        "strengths": [],
        "weaknesses": ["Evaluation could not be performed by Groq LLM."]
    }