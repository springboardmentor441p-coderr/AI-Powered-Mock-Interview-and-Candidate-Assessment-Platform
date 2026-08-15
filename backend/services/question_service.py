import random
from typing import List, Dict
from services.llm_service import generate_llm_questions, is_llm_available

QUESTION_BANK = {
    "Technical": {
        "Easy": [
            {
                "q": "What is the difference between synchronous and asynchronous programming in Python/JavaScript?",
                "a": "Synchronous execution blocks the main thread until a task finishes, while asynchronous execution allows non-blocking operations by running long-running tasks in the background using event loops or promises."
            },
            {
                "q": "Can you explain the main principles of Object-Oriented Programming (OOP)?",
                "a": "The 4 core OOP principles are Encapsulation (bundling data and methods), Abstraction (hiding implementation complexity), Inheritance (reusing parent class attributes), and Polymorphism (redefining methods across subclasses)."
            },
            {
                "q": "What are REST APIs and what are the standard HTTP methods used?",
                "a": "REST (Representational State Transfer) is an architectural style for web services. Standard HTTP methods include GET (read data), POST (create resource), PUT/PATCH (update resource), and DELETE (remove resource)."
            },
            {
                "q": "Explain the difference between SQL relational databases and NoSQL databases.",
                "a": "SQL databases are relational, table-based with fixed schemas (e.g., PostgreSQL), ideal for structured ACID transactions. NoSQL databases (e.g., MongoDB) are document or key-value based, optimized for flexible scaling."
            },
            {
                "q": "How does Git version control work, and what is the difference between git fetch and git pull?",
                "a": "Git tracks changes in code history. 'git fetch' downloads new commits from remote repository without merging them into your local branch, whereas 'git pull' fetches and automatically merges changes."
            }
        ],
        "Medium": [
            {
                "q": "Explain how you would design a scalable backend for a Full Stack application handling asynchronous events.",
                "a": "I would use a decoupled microservices architecture with a FastAPI or Node.js gateway, an asynchronous message queue like Redis or RabbitMQ for event distribution, and scalable worker instances to handle heavy background processing."
            },
            {
                "q": "Explain how JWT (JSON Web Token) authentication works end-to-end.",
                "a": "The client sends login credentials to the server. Upon authentication, the server generates a digitally signed JWT token containing user payload and sends it back. The client attaches this token in HTTP Authorization headers for subsequent protected requests."
            },
            {
                "q": "What is state management in React, and when would you use Context API vs Redux?",
                "a": "React state holds component data. Context API is built-in and best for lightweight global state like themes or user sessions. Redux is preferred for complex enterprise applications with frequent state updates and strict time-travel debugging requirements."
            },
            {
                "q": "How would you optimize a database query that is taking too long to execute?",
                "a": "I analyze the query execution plan using EXPLAIN ANALYZE, add indexes on frequently filtered or joined columns, eliminate N+1 queries using eager loading, and implement Redis caching for high-read endpoints."
            }
        ],
        "Hard": [
            {
                "q": "How would you design a rate-limiting system for a high-traffic REST API backend?",
                "a": "I would implement a Token Bucket or Sliding Window Log algorithm backed by Redis in-memory storage at the API Gateway layer to track request rates per IP or API key with sub-millisecond latency."
            },
            {
                "q": "How do you ensure data consistency across distributed database systems using the CAP theorem?",
                "a": "According to CAP theorem, a distributed system can only guarantee 2 of Consistency, Availability, and Partition Tolerance. In financial transactions, I prioritize Consistency using 2-Phase Commit (2PC) or Saga patterns."
            }
        ]
    },
    "HR": {
        "Easy": [
            {
                "q": "Tell me about yourself and your professional background.",
                "a": "I am a dedicated software developer passionate about building scalable full-stack applications and AI platforms. I have hands-on experience in Python, React, database engineering, and REST API design."
            },
            {
                "q": "Why do you want to join our organization as a candidate?",
                "a": "I am inspired by your company's commitment to technology innovation. My technical skills in full-stack web development and AI system engineering align closely with your team's upcoming product goals."
            },
            {
                "q": "What are your greatest strengths and areas where you are working to improve?",
                "a": "My key strength is analytical problem solving and fast technical learning. An area I am actively improving is public technical presentations, which I practice through mock interviews and tech team discussions."
            }
        ],
        "Medium": [
            {
                "q": "Describe a project you worked on that you are most proud of, and your exact contribution.",
                "a": "I am most proud of building SmartHire AI, an AI candidate assessment platform. I designed the FastAPI backend, integrated Speech-to-Text and MediaPipe vision telemetry, and implemented the weighted scoring rubric."
            },
            {
                "q": "Describe a situation where a technical deployment failed in production. How did you diagnose and resolve it?",
                "a": "I diagnosed the issue by checking server logs and error stack traces, identified a database pool connection leak, applied a hotfix patch to close unhandled connections, and restored system operations with zero data loss."
            }
        ]
    }
}

def generate_interview_questions(category: str, difficulty: str, domain: str, num_questions: int = 5, skills: List[str] = None) -> List[Dict]:
    # 1. Try real LLM generation first if API key configured
    if is_llm_available():
        llm_questions = generate_llm_questions(domain, difficulty, num_questions, skills)
        if llm_questions:
            return llm_questions

    # 2. Fallback to question pool generator
    cat_pool = QUESTION_BANK.get(category, QUESTION_BANK["Technical"])
    diff_pool = cat_pool.get(difficulty, list(cat_pool.values())[0])

    selected = random.sample(diff_pool, min(num_questions, len(diff_pool)))

    result = []
    for i, item in enumerate(selected):
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
