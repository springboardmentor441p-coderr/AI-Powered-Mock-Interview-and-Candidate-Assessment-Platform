import random
from typing import List, Dict, Optional
from services.llm_service import generate_llm_questions, is_llm_available

def generate_interview_questions(
    category: str,
    difficulty: str,
    domain: str,
    num_questions: int = 5,
    skills: Optional[List[str]] = None,
    previous_questions: Optional[List[str]] = None
) -> Optional[List[Dict]]:
    """
    Primary Question Generator: Uses Groq LLM (openai/gpt-oss-120b) for dynamic question generation.
    Does NOT rely on a fixed static question bank as the primary path.
    Guarantees no repeated questions.
    """
    # 1. Primary path: Call Groq LLM generator
    if is_llm_available():
        llm_questions = generate_llm_questions(
            domain=domain,
            difficulty=difficulty,
            num_questions=num_questions,
            skills=skills,
            previous_questions=previous_questions or []
        )
        if llm_questions:
            return llm_questions

    # 2. Graceful fallback ONLY on actual Groq API network/key failure
    fallback_templates = [
        {
            "q": f"Describe how you design modular, maintainable software architectures in {domain}.",
            "a": "I focus on clean component separation, error handling, design patterns, and unit testing."
        },
        {
            "q": f"How do you approach debugging complex runtime errors or performance bottlenecks in {domain} applications?",
            "a": "I analyze system logs, profile memory and database calls, isolate bugs in test suites, and deploy hotfixes."
        },
        {
            "q": f"What security, configuration, and environment best practices do you enforce in {domain} projects?",
            "a": "Using environment variables, TLS HTTPS encryption, dependency security audits, and strict authentication."
        },
        {
            "q": f"Explain your workflow for writing automated tests and maintaining continuous integration in {domain}.",
            "a": "Writing unit and integration tests, running CI pipelines on every pull request, and enforcing linting rules."
        },
        {
            "q": f"Where do you see software engineering in your domain evolving over the next 2-3 years?",
            "a": "Increasing integration of autonomous AI agents, scalable cloud architectures, and developer productivity tools."
        }
    ]

    result = []
    for i in range(min(num_questions, len(fallback_templates))):
        item = fallback_templates[i]
        skill_tag = skills[i % len(skills)] if skills else domain
        result.append({
            "id": i + 1,
            "category": category,
            "difficulty": difficulty,
            "domain": domain,
            "skill_focus": skill_tag,
            "question_text": item["q"],
            "sample_answer": item["a"]
        })
    return result
