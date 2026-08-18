import os
import json
import logging
import difflib
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
# STATUS & HELPER UTILITIES
# =========================================================

def is_llm_available() -> bool:
    """Check whether Groq or OpenAI API key is configured."""
    return bool(GROQ_API_KEY or OPENAI_API_KEY)

def is_question_too_similar(new_question: str, previous_questions: List[str], threshold: float = 0.50) -> bool:
    """
    Checks if a newly generated question is too similar to any previously asked question.
    Returns True if similarity exceeds the threshold.
    """
    if not previous_questions or not new_question:
        return False

    norm_new = new_question.lower().strip()
    for prev_q in previous_questions:
        norm_prev = prev_q.lower().strip()
        ratio = difflib.SequenceMatcher(None, norm_new, norm_prev).ratio()
        if ratio >= threshold:
            logger.warning("Question rejected due to similarity (%.2f): '%s' vs '%s'", ratio, new_question, prev_q)
            return True
    return False

# =========================================================
# GROQ HELPER
# =========================================================

def _call_groq(prompt: str, temperature: float = 0.7) -> Optional[str]:
    """Send a prompt to Groq using model openai/gpt-oss-120b and return response."""
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
                "content": f"You are {INTERVIEWER_NAME}, an expert AI technical interviewer. You conduct realistic professional job interviews. Always return strictly valid JSON.",
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
            logger.error("Groq API error %s: %s", response.status_code, response.text[:1500])
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
                "content": f"You are {INTERVIEWER_NAME}, an expert AI technical interviewer. Always return valid JSON.",
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
        if response.status_code != 200:
            logger.error("OpenAI API error %s: %s", response.status_code, response.text[:1500])
            return None
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception as exc:
        logger.exception("OpenAI error: %s", exc)
        return None

# =========================================================
# DYNAMIC INTERVIEW QUESTION GENERATION (NO HARDCODED BANK)
# =========================================================

def generate_llm_questions(
    domain: str,
    difficulty: str,
    num_questions: int = 5,
    skills: Optional[List[str]] = None,
    previous_questions: Optional[List[str]] = None,
    previous_candidate_answer: str = "",
    resume_text: str = "",
) -> Optional[List[Dict[str, Any]]]:
    """
    Dynamically generates unique interview questions using Groq LLM (openai/gpt-oss-120b).
    Guarantees no repetition against previous_questions.
    """
    skills_text = ", ".join(skills) if skills else domain
    prev_q_list = previous_questions or []
    prev_q_formatted = "\n".join([f"- {q}" for q in prev_q_list]) if prev_q_list else "None (This is the start of the interview)."

    prompt = f"""
You are {INTERVIEWER_NAME}, a professional AI interviewer conducting a realistic technical job interview.

Candidate Target Role / Domain:
{domain}

Interview Difficulty Level:
{difficulty}

Candidate Extracted Resume Skills:
{skills_text}

Candidate Resume Context:
{resume_text if resume_text else "No resume text uploaded."}

PREVIOUS QUESTIONS ALREADY ASKED IN THIS SESSION:
{prev_q_formatted}

Candidate's Previous Answer Context:
{previous_candidate_answer if previous_candidate_answer else "No previous answer provided."}

Number of Unique Questions Needed:
{num_questions}

CRITICAL RULES:
1. Do NOT repeat, paraphrase, or ask any question conceptually similar to the PREVIOUS QUESTIONS listed above.
2. The questions must test deep technical concepts relevant to {domain} and candidate skills ({skills_text}).
3. Avoid adding the role name mechanically (e.g. avoid 'As a Python Developer, tell me...'). Focus on domain-specific architectural and problem-solving concepts.
4. Match the requested difficulty level ({difficulty}).
5. Return ONLY a valid JSON object in this format:

{{
    "questions": [
        {{
            "id": 1,
            "question_text": "Detailed technical question here",
            "sample_answer": "Ideal expected answer",
            "skill_focus": "Technical skill or topic"
        }}
    ]
}}
"""

    content = _call_groq(prompt, temperature=0.75)
    if content:
        try:
            parsed = json.loads(content)
            if isinstance(parsed, dict):
                questions = parsed.get("questions", [])
                filtered = []
                for q in questions:
                    q_text = q.get("question_text", "")
                    if q_text and not is_question_too_similar(q_text, prev_q_list + [fq.get("question_text", "") for fq in filtered]):
                        filtered.append(q)
                
                if len(filtered) > 0:
                    logger.info("%s generated %s unique question(s) via Groq (%s).", INTERVIEWER_NAME, len(filtered), GROQ_MODEL)
                    return filtered
        except json.JSONDecodeError as exc:
            logger.error("Groq returned invalid JSON: %s", exc)

    # Fallback to OpenAI if configured
    content = _call_openai(prompt, temperature=0.75)
    if content:
        try:
            parsed = json.loads(content)
            if isinstance(parsed, dict):
                questions = parsed.get("questions", [])
                filtered = []
                for q in questions:
                    q_text = q.get("question_text", "")
                    if q_text and not is_question_too_similar(q_text, prev_q_list + [fq.get("question_text", "") for fq in filtered]):
                        filtered.append(q)
                if len(filtered) > 0:
                    return filtered
        except json.JSONDecodeError as exc:
            logger.error("OpenAI returned invalid JSON: %s", exc)

    logger.error("No LLM provider generated valid unique interview questions.")
    return None

# =========================================================
# SINGLE ADAPTIVE FOLLOW-UP QUESTION GENERATION
# =========================================================

def generate_single_adaptive_question(
    domain: str,
    difficulty: str,
    skills: Optional[List[str]] = None,
    previous_questions: Optional[List[str]] = None,
    candidate_answer: str = "",
    resume_text: str = ""
) -> Optional[Dict[str, Any]]:
    """
    Generates 1 adaptive follow-up question based on the candidate's last answer.
    Guarantees no repetition against previous questions.
    """
    questions = generate_llm_questions(
        domain=domain,
        difficulty=difficulty,
        num_questions=1,
        skills=skills,
        previous_questions=previous_questions,
        previous_candidate_answer=candidate_answer,
        resume_text=resume_text
    )
    if questions and len(questions) > 0:
        return questions[0]
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
    Evaluate candidate's spoken answer using Groq LLM (openai/gpt-oss-120b).
    Handles answered vs unanswered candidate responses.
    """
    # Explicit unanswered question handling
    if not candidate_answer or candidate_answer.strip() in ["", "Not answered", "[Candidate skipped question without speaking]"]:
        return {
            "evaluation_status": "Unanswered",
            "is_answered": False,
            "technical_score": 0.0,
            "clarity_score": 0.0,
            "relevance_score": 0.0,
            "completeness_score": 0.0,
            "feedback": "Question was skipped without a spoken or written response.",
            "strengths": [],
            "weaknesses": ["Question skipped without an answer."]
        }

    prompt = f"""
You are {INTERVIEWER_NAME}, an expert AI technical interviewer.

Evaluate the candidate's answer to the technical interview question.

Interview Question:
{question_text}

Candidate Spoken Answer:
{candidate_answer}

Ideal Reference Answer:
{sample_answer}

Evaluate technical accuracy, depth, clarity, relevance, and completeness on a scale of 0 to 100.

Return ONLY a valid JSON object:
{{
    "technical_score": 85.0,
    "clarity_score": 90.0,
    "relevance_score": 88.0,
    "completeness_score": 82.0,
    "feedback": "Detailed technical evaluation notes by {INTERVIEWER_NAME}.",
    "strengths": ["Clear technical concept explanation"],
    "weaknesses": ["Minor polish on edge cases"]
}}
"""

    content = _call_groq(prompt, temperature=0.3)
    if content:
        try:
            result = json.loads(content)
            if isinstance(result, dict):
                result["is_answered"] = True
                result["evaluation_status"] = "Answered"
                logger.info("%s evaluated candidate answer using Groq.", INTERVIEWER_NAME)
                return result
        except json.JSONDecodeError as exc:
            logger.error("Invalid JSON from Groq evaluation: %s", exc)

    content = _call_openai(prompt, temperature=0.3)
    if content:
        try:
            result = json.loads(content)
            if isinstance(result, dict):
                result["is_answered"] = True
                result["evaluation_status"] = "Answered"
                return result
        except json.JSONDecodeError as exc:
            logger.error("Invalid JSON from OpenAI evaluation: %s", exc)

    # Truthful error state when LLM evaluation fails
    return {
        "evaluation_status": "Answered",
        "is_answered": True,
        "technical_score": 0.0,
        "clarity_score": 0.0,
        "relevance_score": 0.0,
        "completeness_score": 0.0,
        "feedback": "LLM Evaluation Unavailable: Groq API key or network connection issue.",
        "strengths": [],
        "weaknesses": ["Evaluation could not be performed by Groq LLM."]
    }