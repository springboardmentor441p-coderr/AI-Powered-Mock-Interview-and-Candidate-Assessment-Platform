import json
import random
from typing import Any, List
from app.models.candidate_profile import CandidateProfile
from app.utils.ai_client import generate_text

# Extensive pool of technical and project-related questions per role & level for Round 1
_ROUND1_POOLS = {
    "AI Engineer": {
        "Beginner": [
            "What is the difference between supervised and unsupervised learning, and when would you use each?",
            "Can you explain what overfitting is in Machine Learning, and name two techniques to prevent it?",
            "What are the common activation functions in Neural Networks, and why is ReLU preferred over Sigmoid in deep layers?",
            "Explain how cross-validation works and why it is important for model evaluation."
        ],
        "Intermediate": [
            "How does backpropagation work in deep neural networks? Explain the role of the chain rule.",
            "Can you compare Gradient Boosting (like XGBoost) with Random Forest? Under what conditions does XGBoost outperform Random Forest?",
            "Explain the architecture of a standard Transformer. What is the role of self-attention?",
            "How do you handle highly imbalanced datasets when training a classification model? Compare resampling with class weighting."
        ],
        "Advanced": [
            "Describe the mathematical intuition behind the Self-Attention mechanism in Transformers. How does multi-head attention improve representation learning?",
            "When scaling training of large language models, what are the trade-offs between Data Parallelism, Pipeline Parallelism, and Tensor Parallelism?",
            "Explain how you would mitigate hallucination and verify output reliability in Retrieval-Augmented Generation (RAG) pipelines.",
            "How do you optimize neural networks for edge deployment? Compare quantization, pruning, and knowledge distillation."
        ]
    },
    "Python Developer": {
        "Beginner": [
            "What is the difference between a list and a tuple in Python, and when would you use a tuple?",
            "Explain how memory management works in Python, specifically focusing on garbage collection and reference counting.",
            "What are decorators in Python? Can you describe a practical use case where you would write one?",
            "What is the difference between shallow copy and deep copy in Python?"
        ],
        "Intermediate": [
            "Explain the difference between multithreading and multiprocessing in Python, and how the Global Interpreter Lock (GIL) affects them.",
            "How do generator functions and the 'yield' keyword help in writing memory-efficient Python code?",
            "What is the difference between async/await coroutines and synchronous functions in Python? How does the event loop run them?",
            "Describe the method resolution order (MRO) in Python multiple inheritance, and how super() resolves class methods."
        ],
        "Advanced": [
            "How would you design a custom metaclass in Python to enforce coding standards or register classes dynamically at load time?",
            "Explain Python's memory allocation details (PyMalloc, arenas, pools, blocks) and how you would diagnose a memory leak in a running FastAPI service.",
            "How do you optimize critical path performance in Python? Compare using Cython, multiprocessing, and asyncio for I/O bound vs CPU bound tasks.",
            "Explain descriptor protocols in Python. How do property, classmethod, and staticmethod decorators work under the hood?"
        ]
    },
    "Backend Developer": {
        "Beginner": [
            "What are the differences between REST and GraphQL APIs, and when would you prefer one over the other?",
            "Explain the difference between SQL and NoSQL databases. In what scenarios would you choose SQL?",
            "What is database indexing, and how does it speed up queries? Are there any disadvantages?",
            "Explain what JWT (JSON Web Token) is and how it is used for secure user authentication."
        ],
        "Intermediate": [
            "What are the ACID properties in database systems? How does database replication differ from database sharding?",
            "Explain the N+1 query problem in Object-Relational Mappings (ORMs). How do you identify and solve it?",
            "How do you implement microservices communication? Compare synchronous REST/gRPC calls with asynchronous message brokers like RabbitMQ or Kafka.",
            "Explain how connection pooling works and why it is critical for backend performance under high load."
        ],
        "Advanced": [
            "How would you design a distributed database transaction mechanism across independent microservices? Compare Two-Phase Commit with the Saga Pattern.",
            "Explain the CAP theorem. If network partitioning occurs, how do you trade off consistency and availability in a global banking system?",
            "Explain database isolation levels (Read Uncommitted, Read Committed, Repeatable Read, Serializable) and how they prevent dirty reads or phantom reads.",
            "How do you design a high-throughput rate limiting service? Describe the token bucket and sliding window algorithms, and how to scale them with Redis."
        ]
    }
}

# Generic fallback pool for roles not explicitly mapped
_GENERIC_POOLS = {
    "Beginner": [
        "What are the fundamental principles of Object-Oriented Programming (OOP)?",
        "What is the role of version control systems like Git, and how does git merge conflict resolution work?",
        "Explain what a RESTful API is and what HTTP status codes like 200, 400, 401, 404, and 500 mean.",
        "What is a relational database? Explain primary keys and foreign keys."
    ],
    "Intermediate": [
        "Explain the concept of caching. What are the common eviction policies, and how does Redis handle them?",
        "Describe the software development lifecycle (SDLC) and how CI/CD pipelines automate testing and deployment.",
        "What is the difference between horizontal and vertical scaling, and how does load balancing help in distributing traffic?",
        "Explain the importance of unit testing and how mock objects help isolate test environments."
    ],
    "Advanced": [
        "How do you design a highly available, fault-tolerant system that handles millions of requests per second? Detail the layers involved.",
        "Explain the design decisions you would make when migrating a monolith system into microservices. How do you handle database migration?",
        "Describe common security vulnerabilities like SQL Injection, XSS, and CSRF, and how to safeguard backend applications against them.",
        "What is blue-green deployment? Compare it with canary releases and rolling updates."
    ]
}


class QuestionGenerator:
    async def generate_question(
        self,
        profile: CandidateProfile | None,
        job_role: str,
        difficulty: str,
        round_number: int,
        question_number: int,
        previous_questions: List[str],
        previous_answers: List[str],
        topics_covered: List[str],
    ) -> str:
        """
        Generate one highly relevant, adaptive question.
        Uses Gemini API if key is available. Falls back to highly structured rule-based templates.
        """
        # Load profile items for prompt framing
        skills = []
        projects = []
        if profile:
            try:
                skills = json.loads(profile.skills or "[]")
                projects = json.loads(profile.projects or "[]")
            except Exception:
                pass

        # Try using LLM
        prompt = self._build_prompt(
            skills, projects, job_role, difficulty, round_number,
            question_number, previous_questions, previous_answers, topics_covered
        )
        system_instruction = (
            "You are an expert technical interviewer representing top-tier product companies (like Google, Amazon, Microsoft). "
            "Your job is to ask ONE, and ONLY ONE, highly specific, professional interview question. Do not include greetings, introductions, or conversational filler. "
            "Focus heavily on technical details, architecture, coding concepts, or candidate projects as appropriate."
        )

        response = await generate_text(prompt, system_instruction)
        if response:
            return response

        # Fallback to local heuristic question generator
        return self._generate_fallback(
            skills, projects, job_role, difficulty, round_number, question_number, previous_questions, topics_covered
        )

    def _build_prompt(
        self,
        skills: List[str],
        projects: List[dict],
        job_role: str,
        difficulty: str,
        round_number: int,
        question_number: int,
        previous_questions: List[str],
        previous_answers: List[str],
        topics_covered: List[str]
    ) -> str:
        history_summary = ""
        if previous_questions:
            history_summary = "Here is the dialogue history of this session so far:\n"
            for q, a in zip(previous_questions, previous_answers):
                history_summary += f"Interviewer: {q}\nCandidate: {a}\n\n"

        proj_summary = ""
        if projects:
            proj_summary = "Candidate's projects:\n"
            for p in projects:
                proj_summary += f"- {p.get('title')}: {p.get('description')}\n"

        prompt = (
            f"Role being interviewed for: {job_role}\n"
            f"Difficulty Level: {difficulty}\n"
            f"Round Number: {round_number} (Round 1 is core skills & concept depth. Round 2 is project-specific architecture, scenarios, and optimization)\n"
            f"Question number in this round: {question_number}\n"
            f"Candidate Skills: {', '.join(skills)}\n"
            f"{proj_summary}\n"
            f"Topics already covered: {', '.join(topics_covered)}\n\n"
            f"{history_summary}"
            f"Please generate the next question. Follow these strict rules:\n"
            f"1. Ask EXACTLY ONE question.\n"
            f"2. Never ask a question that is identical or very similar to one already asked.\n"
            f"3. Tailor the question specifically to the role, difficulty, and candidate skills.\n"
            f"4. If in Round 2, base the question on the candidate's projects, design choices, and systems design/architecture/optimization issues.\n"
            f"5. Start directly with the question text without prefixing with 'Question:' or 'Interviewer:'."
        )
        return prompt

    def _generate_fallback(
        self,
        skills: List[str],
        projects: List[dict],
        job_role: str,
        difficulty: str,
        round_number: int,
        question_number: int,
        previous_questions: List[str],
        topics_covered: List[str]
    ) -> str:
        # Round 2: project and technology architecture specific
        if round_number == 2:
            if projects:
                proj = projects[question_number % len(projects)]
                title = proj.get("title", "your recent project")
                techs = [s for s in skills if s.lower() in (proj.get("description", "") or "").lower()]
                tech_phrase = f" using {', '.join(techs)}" if techs else ""
                
                templates = [
                    f"In your project '{title}', what was the primary architectural bottleneck you faced, and how did you resolve it?",
                    f"Looking at the implementation of '{title}'{tech_phrase}, what design trade-offs did you make when choosing this technology stack?",
                    f"For your project '{title}', how did you handle data consistency and reliability? What testing strategies did you use to validate it?",
                    f"In '{title}', if you had to scale the request throughput by 10x, what caching or horizontal scaling mechanisms would you introduce?",
                    f"Can you explain the deployment pipeline for '{title}'? How did you handle environment configuration and monitoring?"
                ]
                # Avoid duplicate question template if possible
                for t in templates:
                    if t not in previous_questions:
                        return t
                return templates[0]
            else:
                # If no projects in profile, ask behavioral or tech design choices
                tech = skills[question_number % len(skills)] if skills else "your language of choice"
                return f"Explain a challenging production issue or bug you faced when working with {tech}. How did you debug it, and what did you learn?"

        # Round 1: Role and difficulty based
        role_pool = _ROUND1_POOLS.get(job_role) or _ROUND1_POOLS.get("AI Engineer")  # Default to AI Engineer
        if job_role not in _ROUND1_POOLS:
            # Fallback to generic pool if role not explicitly mapped
            pool = _GENERIC_POOLS.get(difficulty) or _GENERIC_POOLS["Intermediate"]
        else:
            pool = role_pool.get(difficulty) or role_pool["Intermediate"]

        # Filter out questions that have already been asked
        unasked = [q for q in pool if q not in previous_questions]
        if unasked:
            return random.choice(unasked)

        # Fallback if all are asked
        if pool:
            return random.choice(pool)

        return "Could you describe a challenging technical problem you solved recently and the impact of your solution?"
