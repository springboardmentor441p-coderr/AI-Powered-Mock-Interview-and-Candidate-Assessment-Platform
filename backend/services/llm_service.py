import os
import json
import time
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
# STATUS & REPETITION HELPER UTILITIES
# =========================================================

def is_llm_available() -> bool:
    """Check whether Groq or OpenAI API key is configured."""
    return bool(GROQ_API_KEY or OPENAI_API_KEY)

def is_question_too_similar(new_question: str, previous_questions: List[str], threshold: float = 0.40) -> bool:
    """
    Checks if a newly generated question is semantically or structurally too similar to any previously asked question.
    Calculates sequence matcher ratio and word-token Jaccard overlap.
    """
    if not previous_questions or not new_question:
        return False

    norm_new = new_question.lower().strip()
    words_new = set(norm_new.split())

    for prev_q in previous_questions:
        norm_prev = prev_q.lower().strip()
        words_prev = set(norm_prev.split())

        # 1. Sequence Matcher Ratio
        seq_ratio = difflib.SequenceMatcher(None, norm_new, norm_prev).ratio()

        # 2. Token Jaccard Overlap
        if words_new and words_prev:
            jaccard = len(words_new.intersection(words_prev)) / float(len(words_new.union(words_prev)))
        else:
            jaccard = 0.0

        if seq_ratio >= threshold or jaccard >= 0.45:
            logger.warning("Question rejected due to similarity (seq: %.2f, jaccard: %.2f): '%s' vs '%s'", seq_ratio, jaccard, new_question, prev_q)
            return True

    return False

# =========================================================
# GROQ HELPER (WITH NETWORK RETRY LOGIC)
# =========================================================

def _call_groq(prompt: str, temperature: float = 0.8, max_retries: int = 3) -> Optional[str]:
    """Send a prompt to Groq using model openai/gpt-oss-120b with retry logic."""
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
                "content": f"You are {INTERVIEWER_NAME}, a senior AI technical interviewer conducting a live professional interview. Always return strictly valid JSON.",
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

    for attempt in range(1, max_retries + 1):
        try:
            logger.info("Calling Groq model: %s (attempt %d/%d)", GROQ_MODEL, attempt, max_retries)
            response = requests.post(
                GROQ_URL,
                headers=headers,
                json=payload,
                timeout=30,
            )

            logger.info("Groq HTTP status: %s", response.status_code)

            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return content
            elif response.status_code in [429, 500, 502, 503, 504]:
                logger.warning("Groq API transient status %s. Retrying in %ds...", response.status_code, attempt)
                time.sleep(attempt)
            else:
                logger.error("Groq API error %s: %s", response.status_code, response.text[:1500])
                return None

        except requests.RequestException as exc:
            logger.warning("Groq network glitch on attempt %d/%d: %s", attempt, max_retries, exc)
            if attempt < max_retries:
                time.sleep(attempt)

    logger.error("Groq API failed after %d attempts.", max_retries)
    return None

# =========================================================
# OPENAI HELPER (Secondary Fallback if configured)
# =========================================================

def _call_openai(prompt: str, temperature: float = 0.8) -> Optional[str]:
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
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except Exception as exc:
        logger.exception("OpenAI error: %s", exc)
    return None

# =========================================================
# DYNAMIC INTERVIEW QUESTION GENERATION (STRICT GROQ ONLY)
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
    Dynamically generates unique, highly specific technical interview questions using Groq LLM (openai/gpt-oss-120b).
    Guarantees topic diversity across Easy/Medium/Hard tiers and rejects repetitive questions.
    """
    skills_text = ", ".join(skills) if (skills and len(skills) > 0) else domain
    prev_q_list = previous_questions or []
    prev_q_formatted = "\n".join([f"- {q}" for q in prev_q_list]) if prev_q_list else "None (This is the beginning of the interview)."

    difficulty_guidance = ""
    if difficulty.lower() == "easy":
        difficulty_guidance = "Ask core language concepts, fundamental data structures, standard library tools, or basic REST API design."
    elif difficulty.lower() == "medium":
        difficulty_guidance = "Ask production scenario questions involving memory management, async IO, database indexing, framework internals, or error debugging."
    else:  # Hard
        difficulty_guidance = "Ask high-scale system design architecture, distributed system consistency, multi-region fault tolerance, zero-downtime deployment pipelines, or microsecond latency trade-offs."

    prompt = f"""
You are {INTERVIEWER_NAME}, a senior AI technical interviewer conducting a live, realistic technical job interview.

Target Role / Domain: {domain}
Difficulty Tier: {difficulty}
Difficulty Directive: {difficulty_guidance}
Candidate Skills: {skills_text}
Candidate Resume Context: {resume_text if resume_text else "No resume uploaded."}

PREVIOUS QUESTIONS ASKED IN THIS SESSION:
{prev_q_formatted}

Candidate's Previous Answer Context:
{previous_candidate_answer if previous_candidate_answer else "No previous answer."}

Number of Unique Questions Needed: {num_questions}

CRITICAL RULES:
1. Do NOT ask generic intro templates like 'Welcome! Please introduce yourself...' or 'What technical tools, frameworks, and best practices do you utilize...'.
2. Ask realistic, deep technical questions tailored specifically to {domain} and candidate skills ({skills_text}).
3. For Question 1, ask a realistic, specific technical question about the candidate's hands-on experience and architectural decisions in {domain}.
4. Every single question must be unique and cover a DISTINCT sub-topic.
5. Do NOT repeat or paraphrase any question from the PREVIOUS QUESTIONS listed above.

Return ONLY a valid JSON object in this format:
{{
    "questions": [
        {{
            "id": 1,
            "question_text": "Detailed, specific technical question here",
            "sample_answer": "Expected ideal response",
            "skill_focus": "Specific topic tag"
        }}
    ]
}}
"""

    content = _call_groq(prompt, temperature=0.85)
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
    content = _call_openai(prompt, temperature=0.85)
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
        "feedback": "LLM Evaluation Unavailable: Groq API network connection issue.",
        "strengths": [],
        "weaknesses": ["Evaluation could not be performed by Groq LLM."]
    }