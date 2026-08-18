import logging
from typing import List, Dict, Optional
from services.llm_service import generate_llm_questions, is_llm_available

logger = logging.getLogger(__name__)

def generate_interview_questions(
    category: str,
    difficulty: str,
    domain: str,
    num_questions: int = 5,
    skills: Optional[List[str]] = None,
    previous_questions: Optional[List[str]] = None
) -> Optional[List[Dict]]:
    """
    Dynamic Question Generator: Uses Groq LLM (openai/gpt-oss-120b) as the SOLE question source.
    Does NOT use any hardcoded or static fallback question banks.
    Returns None if LLM generation fails so an explicit API error is returned to the user.
    """
    if not is_llm_available():
        logger.error("Groq API key is not configured. Unable to generate dynamic questions.")
        return None

    llm_questions = generate_llm_questions(
        domain=domain,
        difficulty=difficulty,
        num_questions=num_questions,
        skills=skills,
        previous_questions=previous_questions or []
    )

    if llm_questions and len(llm_questions) > 0:
        return llm_questions

    logger.error("Groq LLM question generation returned no valid questions.")
    return None
