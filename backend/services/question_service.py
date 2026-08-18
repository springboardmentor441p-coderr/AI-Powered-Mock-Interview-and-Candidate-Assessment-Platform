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
    Dynamic Question Generator:
    Begins naturally with a welcoming self-introduction prompt from Mira (Q1).
    Subsequent questions (Q2..Q5) are dynamically generated via Groq LLM (openai/gpt-oss-120b)
    to cover technical scenarios, adaptive follow-ups, and difficulty depth without repetition.
    """
    if not is_llm_available():
        logger.error("Groq API key is not configured. Unable to generate dynamic questions.")
        return None

    # Q1: Natural Conversational Self-Introduction Opening
    intro_question = {
        "id": 1,
        "question_text": f"Welcome! I'm Mira, your AI technical interviewer today. To get started, could you briefly introduce yourself and highlight your experience relevant to the {domain} role?",
        "sample_answer": "Brief candidate self-introduction highlighting technical background and key project experience.",
        "skill_focus": "Self Introduction & Background"
    }

    # Generate dynamic Groq technical questions for subsequent turns
    tech_count = max(num_questions - 1, 4)
    llm_questions = generate_llm_questions(
        domain=domain,
        difficulty=difficulty,
        num_questions=tech_count,
        skills=skills,
        previous_questions=(previous_questions or []) + [intro_question["question_text"]]
    )

    if llm_questions and len(llm_questions) > 0:
        for idx, q in enumerate(llm_questions):
            q["id"] = idx + 2

        all_questions = [intro_question] + llm_questions
        return all_questions[:num_questions]

    logger.error("Groq LLM question generation returned no valid questions.")
    return None
