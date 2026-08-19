import logging
from typing import List, Dict, Optional
from services.llm_service import generate_llm_questions, is_llm_available

logger = logging.getLogger(__name__)

FALLBACK_QUESTIONS_BANK = {
    "Python Developer": [
        {
            "question_text": "Could you explain how Python manages memory internally, specifically focusing on reference counting and garbage collection for cyclical references?",
            "sample_answer": "Python uses reference counting as its primary memory management mechanism along with a generational garbage collector to detect and sweep reference cycles.",
            "skill_focus": "Python Memory & Garbage Collection"
        },
        {
            "question_text": "Suppose your FastAPI application receives thousands of concurrent requests and database connection pool latency spikes. How would you diagnose and optimize this bottleneck?",
            "sample_answer": "Analyze async endpoint execution, ensure DB queries do not block event loop, adjust connection pool size, and introduce async caching layer like Redis.",
            "skill_focus": "FastAPI Async Performance"
        },
        {
            "question_text": "How do Python generators and iterators differ from standard lists in terms of memory efficiency and execution flow during large data streaming?",
            "sample_answer": "Generators evaluate values lazily on-demand using yield, maintaining O(1) memory complexity compared to loading full datasets into list memory.",
            "skill_focus": "Generators & Iterators"
        },
        {
            "question_text": "In a distributed Python microservices architecture, how do you handle structured logging, error propagation, and central telemetry tracking across services?",
            "sample_answer": "Use correlation IDs in request headers, format logs as structured JSON, and stream metrics to centralized APM platforms like OpenTelemetry.",
            "skill_focus": "Distributed Logging & Microservices"
        },
        {
            "question_text": "Explain the Python Global Interpreter Lock (GIL) and how it affects multi-threaded vs multi-process execution for CPU-bound tasks.",
            "sample_answer": "The GIL prevents multi-threaded CPython from executing bytecode on multiple CPU cores simultaneously; multiprocessing bypasses this with separate memory spaces.",
            "skill_focus": "Python Concurrency & GIL"
        },
        {
            "question_text": "How do you implement custom Python decorators to handle authentication, rate limiting, and execution logging cleanly across API endpoints?",
            "sample_answer": "Use functools.wraps to preserve wrapper metadata and execute pre/post logic around decorated callables.",
            "skill_focus": "Decorators & Metaprogramming"
        },
        {
            "question_text": "How do you approach database schema migrations in production Python projects using Alembic or Django ORM without causing table locks?",
            "sample_answer": "Perform non-breaking additive migrations, create indexes concurrently, and execute field deprecations in multi-stage releases.",
            "skill_focus": "Database Migrations"
        },
        {
            "question_text": "Describe how you optimize Pydantic data validation and serialization overhead in high-performance FastAPI microservices.",
            "sample_answer": "Utilize Pydantic V2 Rust-backed core validators, reduce nested schema parsing, and leverage direct ORM serialization.",
            "skill_focus": "FastAPI & Pydantic Optimization"
        },
        {
            "question_text": "What strategies do you use for dependency injection, test mocking, and isolating external HTTP services during pytest unit testing?",
            "sample_answer": "Use pytest fixtures, dependency overrides in FastAPI, and mock HTTP transport layers with httpx-mock or unittest.mock.",
            "skill_focus": "Testing & Mocking"
        }
    ],
    "Backend Engineering": [
        {
            "question_text": "When designing a RESTful API for high throughput, how do you approach database indexing, caching strategies, and connection pooling?",
            "sample_answer": "Use composite indexes on query fields, cache frequent reads with Redis, and configure connection pools to match worker concurrency.",
            "skill_focus": "API Architecture & Caching"
        },
        {
            "question_text": "How do you maintain data consistency across microservices without resorting to monolithic distributed transactions?",
            "sample_answer": "Implement saga patterns (orchestration/choreography) or transactional outbox with event-driven messaging.",
            "skill_focus": "Microservices Consistency & Saga"
        },
        {
            "question_text": "Explain how database indexing strategies (B-Trees vs Hash indexes) impact query execution plans for read-heavy versus write-heavy workloads.",
            "sample_answer": "B-Tree indexes optimize range queries and sorting at cost of write amplification; Hash indexes provide O(1) exact equality lookups.",
            "skill_focus": "Database Indexing & Query Plans"
        },
        {
            "question_text": "Suppose an external API integrated with your backend experiences intermittent failures. How would you implement circuit breakers and retries safely?",
            "sample_answer": "Wrap external calls in circuit breaker state machines with exponential backoff and jitter to avoid thundering herd problem.",
            "skill_focus": "Resilience & Circuit Breaker"
        }
    ]
}

def get_fallback_questions(domain: str, tech_count: int) -> List[Dict]:
    pool = FALLBACK_QUESTIONS_BANK.get(domain, FALLBACK_QUESTIONS_BANK["Python Developer"])
    res = []
    for i in range(tech_count):
        item = dict(pool[i % len(pool)])
        item["id"] = i + 2
        res.append(item)
    return res

def generate_interview_questions(
    category: str,
    difficulty: str,
    domain: str,
    num_questions: int = 5,
    skills: Optional[List[str]] = None,
    previous_questions: Optional[List[str]] = None
) -> List[Dict]:
    """
    Dynamic Question Generator:
    Begins naturally with a welcoming self-introduction prompt from Mira (Q1).
    Subsequent questions are dynamically generated via Groq LLM (openai/gpt-oss-120b)
    matching the exact configured question count (num_questions).
    """
    intro_question = {
        "id": 1,
        "question_text": f"Welcome! I'm Mira, your AI technical interviewer today. To get started, could you briefly introduce yourself and highlight your experience relevant to the {domain} role?",
        "sample_answer": "Brief candidate self-introduction highlighting technical background and key project experience.",
        "skill_focus": "Self Introduction & Background"
    }

    tech_count = max(num_questions - 1, 1)
    llm_questions = None

    if is_llm_available():
        try:
            llm_questions = generate_llm_questions(
                domain=domain,
                difficulty=difficulty,
                num_questions=tech_count,
                skills=skills,
                previous_questions=(previous_questions or []) + [intro_question["question_text"]]
            )
        except Exception as err:
            logger.error("Exception in generate_llm_questions: %s", err)
            llm_questions = None

    if not llm_questions or len(llm_questions) < tech_count:
        logger.info("Supplementing with domain fallback questions for %s (%s)", domain, difficulty)
        fallback = get_fallback_questions(domain, tech_count)
        if not llm_questions:
            llm_questions = fallback
        else:
            needed = tech_count - len(llm_questions)
            llm_questions.extend(fallback[:needed])

    for idx, q in enumerate(llm_questions):
        q["id"] = idx + 2

    all_questions = [intro_question] + llm_questions
    return all_questions[:num_questions]

def generate_adaptive_followup_question(
    domain: str,
    difficulty: str,
    skills: Optional[List[str]] = None,
    previous_questions: Optional[List[str]] = None,
    candidate_answer: Optional[str] = ""
) -> Dict:
    """
    Generates a single follow-up technical question dynamically via Groq LLM or domain fallback bank.
    Guaranteed to return a valid question dictionary.
    """
    fallback_pool = get_fallback_questions(domain, 10)

    if is_llm_available():
        try:
            llm_questions = generate_llm_questions(
                domain=domain,
                difficulty=difficulty,
                num_questions=1,
                skills=skills,
                previous_questions=previous_questions or []
            )
            if llm_questions and len(llm_questions) > 0 and llm_questions[0].get("question_text"):
                return llm_questions[0]
        except Exception as err:
            logger.error("Exception in generate_adaptive_followup_question LLM: %s", err)

    prev_set = set(p.lower().strip() for p in (previous_questions or []))
    for item in fallback_pool:
        if item["question_text"].lower().strip() not in prev_set:
            return item

    return fallback_pool[0]
