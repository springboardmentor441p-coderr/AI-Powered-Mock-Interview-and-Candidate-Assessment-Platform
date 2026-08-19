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
    ],
    "Data Structures & Algorithms (DSA)": [
        {
            "question_text": "How would you design a LRU (Least Recently Used) cache with O(1) time complexity for both get and put operations?",
            "sample_answer": "Combine a Hash Map for fast key lookup with a Doubly Linked List to maintain access order in O(1) time.",
            "skill_focus": "LRU Cache & Linked List"
        },
        {
            "question_text": "Can you explain the difference between BFS and DFS traversal algorithms, detailing scenarios where BFS is strictly preferred over DFS?",
            "sample_answer": "BFS explores level-by-level using a queue, finding shortest path in unweighted graphs; DFS explores depth first using stack/recursion.",
            "skill_focus": "Graph Algorithms & BFS/DFS"
        },
        {
            "question_text": "What is the time and space complexity of QuickSort versus MergeSort, and why is QuickSort often preferred in practical memory-constrained environments?",
            "sample_answer": "MergeSort is O(N log N) guaranteed but needs O(N) extra space; QuickSort is O(N log N) average and operates in-place O(log N) stack space.",
            "skill_focus": "Sorting Algorithms Complexity"
        },
        {
            "question_text": "How would you detect a cycle in a directed graph versus an undirected graph efficiently?",
            "sample_answer": "For directed graphs use DFS recursion stack state (visited/visiting); for undirected graphs use Union-Find or DFS checking parent pointers.",
            "skill_focus": "Graph Cycle Detection"
        }
    ]
}

def get_fallback_questions(domain: str, num_questions: int = 5) -> List[Dict]:
    fallback_pool = FALLBACK_QUESTIONS_BANK.get(domain, FALLBACK_QUESTIONS_BANK["Python Developer"])
    return fallback_pool[:max(num_questions - 1, 1)]

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
    Subsequent questions (Q2..Q5) are dynamically generated via Groq LLM (openai/gpt-oss-120b)
    or high-quality domain fallback questions if Groq LLM is unavailable.
    """
    # Q1: Natural Conversational Self-Introduction Opening
    intro_question = {
        "id": 1,
        "question_text": f"Welcome! I'm Mira, your AI technical interviewer today. To get started, could you briefly introduce yourself and highlight your experience relevant to the {domain} role?",
        "sample_answer": "Brief candidate self-introduction highlighting technical background and key project experience.",
        "skill_focus": "Self Introduction & Background"
    }

    tech_count = max(num_questions - 1, 4)
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

    if not llm_questions or len(llm_questions) == 0:
        logger.info("Using domain fallback questions for %s (%s)", domain, difficulty)
        llm_questions = get_fallback_questions(domain, tech_count)

    for idx, q in enumerate(llm_questions):
        q["id"] = idx + 2

    all_questions = [intro_question] + llm_questions
    return all_questions[:num_questions]
