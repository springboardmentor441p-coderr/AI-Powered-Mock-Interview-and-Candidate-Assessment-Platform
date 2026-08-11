"""
services/question_generator.py — Generate interview questions using OpenAI GPT or Rich Fallback

Tailored to:
  - Candidate's resume skills
  - Interview type (Technical / Behavioral / System Design / HR)
  - Domain (35 specialized domains)
  - Difficulty level (Easy / Medium / Hard)
  - Format (Conceptual / Coding / MCQ / Mixed)
"""
import os, json, random

def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key or api_key.startswith("sk-your"):
        return None
    try:
        from openai import OpenAI
        return OpenAI(api_key=api_key)
    except Exception as e:
        print(f"[QuestionGen] Error initializing OpenAI client: {e}")
        return None


SYSTEM_PROMPT = """You are an expert interviewer AI for SmartHire AI platform.
Generate interview questions that are realistic, specific, and matched to the candidate's domain, interview topic, format, and background.
Always respond with valid JSON array only — no markdown, no extra text."""


def build_prompt(
    skills: list[str],
    interview_type: str,
    domain: str,
    difficulty: str,
    num_questions: int = 5,
    question_format: str = "Mixed",
) -> str:
    skill_str = ", ".join(skills[:10]) if skills else "general domain skills"
    
    format_instruction = ""
    if question_format == "Coding":
        format_instruction = "All questions must be hands-on Coding Challenges with starter code in python or javascript."
    elif question_format == "MCQ":
        format_instruction = "All questions must be Multiple Choice Questions (MCQ) with 4 options (A, B, C, D) and 1 correct_answer specified."
    elif question_format == "Mixed":
        format_instruction = "Include a mix of Conceptual Q&A, Multiple Choice (MCQ), and Live Coding challenges."
    else:
        format_instruction = "All questions should be conceptual or scenario-based Q&A."

    return f"""
Generate {num_questions} interview questions for a candidate specializing in: {domain}
Candidate Skills: {skill_str}
Interview Type / Topic: {interview_type}
Question Format: {question_format}
Difficulty: {difficulty}

Rules:
- Questions MUST be strictly specific to the "{domain}" domain and "{interview_type}" topic.
- {format_instruction}
- Hard questions should test advanced production scenarios and algorithms.
- Easy questions test core fundamentals.

JSON Schema per item:
{{
  "question_number": 1,
  "question_text": "...",
  "question_type": "Coding | MCQ | Conceptual | {interview_type}",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],  // Include ONLY if question_type is MCQ
  "correct_answer": "A) ...",                          // Include ONLY if question_type is MCQ
  "starter_code": "def solution():\\n    pass",         // Include ONLY if question_type is Coding
  "expected_keywords": ["keyword1", "keyword2"]
}}

Return JSON array of {num_questions} questions.
"""


def generate_questions(
    skills: list[str],
    interview_type: str,
    domain: str,
    difficulty: str,
    num_questions: int = 5,
    question_format: str = "Mixed",
) -> list[dict]:
    """
    Call OpenAI to generate questions.
    Returns list of question dicts.
    Falls back to domain-specific fallback bank if API is unavailable.
    """
    client = get_openai_client()
    if not client:
        return _fallback_questions(interview_type, domain, difficulty, question_format, num_questions)

    try:
        prompt = build_prompt(skills, interview_type, domain, difficulty, num_questions, question_format)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.7,
            max_tokens=2500,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```json"):
            raw = raw[7:]
        if raw.startswith("```"):
            raw = raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        questions = json.loads(raw.strip())
        return questions

    except Exception as e:
        print(f"[QuestionGen] OpenAI error: {e} — using domain fallback questions")
        return _fallback_questions(interview_type, domain, difficulty, question_format, num_questions)


def _fallback_questions(interview_type: str, domain: str, difficulty: str, question_format: str, n: int) -> list[dict]:
    """Generate rich domain and format-specific questions when offline or API key missing."""
    
    # ── Domain-Specific Questions Bank ─────────────────────────────────────────
    domain_banks = {
        "Full Stack Web Development": [
            {"text": "Explain how Server-Side Rendering (SSR) in Next.js differs from Client-Side Rendering (CSR) in React.", "type": "Conceptual"},
            {"text": "Which HTTP status code represents 'Payload Too Large'?", "type": "MCQ", "options": ["A) 400 Bad Request", "B) 413 Payload Too Large", "C) 422 Unprocessable", "B) 502 Bad Gateway"], "correct_answer": "B) 413 Payload Too Large"},
            {"text": "Write a JavaScript function to throttle high-frequency DOM scroll events.", "type": "Coding", "starter_code": "function throttle(fn, delay) {\n  // Implement throttle logic here\n}"},
            {"text": "How do WebSockets differ from HTTP Long Polling for real-time data streaming?", "type": "Conceptual"},
            {"text": "What is the primary purpose of CORS in web security?", "type": "MCQ", "options": ["A) Encrypt API requests", "B) Restrict cross-origin resource requests", "C) Compress HTTP payloads", "D) Speed up DNS resolution"], "correct_answer": "B) Restrict cross-origin resource requests"},
            {"text": "Write a SQL query or MongoDB query to fetch the top 5 highest spending customers.", "type": "Coding", "starter_code": "-- SQL Query\nSELECT customer_id, SUM(total_amount) AS total_spent\nFROM orders\nGROUP BY customer_id\n..."},
        ],
        "Frontend Development": [
            {"text": "What is the Virtual DOM in React and how does reconciliation compute minimal layout diffs?", "type": "Conceptual"},
            {"text": "Which CSS unit is relative to the font-size of the root element (html)?", "type": "MCQ", "options": ["A) em", "B) rem", "C) vh", "D) px"], "correct_answer": "B) rem"},
            {"text": "Implement a custom React hook `useDebounce(value, delay)`.", "type": "Coding", "starter_code": "function useDebounce(value, delay) {\n  const [debounced, setDebounced] = useState(value);\n  // Write hook logic\n  return debounced;\n}"},
            {"text": "Explain how CSS Flexbox gap differs from Grid gap in responsive layouts.", "type": "Conceptual"},
        ],
        "Backend Development": [
            {"text": "Compare process-based concurrency vs async I/O event loops in Python asyncio and Node.js.", "type": "Conceptual"},
            {"text": "Which HTTP method is idempotent according to REST standards?", "type": "MCQ", "options": ["A) POST", "B) PUT", "C) PATCH", "D) CONNECT"], "correct_answer": "B) PUT"},
            {"text": "Write a Python function to validate and parse JWT claims securely.", "type": "Coding", "starter_code": "import jwt\n\ndef verify_token(token, secret_key):\n    # Decode and return payload\n    pass"},
        ],
        "Artificial Intelligence & LLM Engineering": [
            {"text": "Explain the Multi-Head Attention mechanism in Transformer neural architectures.", "type": "Conceptual"},
            {"text": "What does RAG stand for in Generative AI architectures?", "type": "MCQ", "options": ["A) Random Access Generation", "B) Retrieval-Augmented Generation", "C) Recursive Auto-Grading", "D) Residual Alignment Grouping"], "correct_answer": "B) Retrieval-Augmented Generation"},
            {"text": "Write a Python function using cosine similarity to rank vector embeddings.", "type": "Coding", "starter_code": "import numpy as np\n\ndef cosine_sim(vec1, vec2):\n    # Calculate and return cosine similarity\n    pass"},
        ],
        "Cloud Engineering & DevOps": [
            {"text": "Explain Kubernetes Pod eviction policies during node memory pressure.", "type": "Conceptual"},
            {"text": "Which AWS service is designed for serverless execution of containerized applications?", "type": "MCQ", "options": ["A) EC2", "B) AWS Fargate / ECS", "C) EBS", "D) CloudFront"], "correct_answer": "B) AWS Fargate / ECS"},
            {"text": "Write a Terraform resource definition to deploy a secure AWS S3 bucket with encryption enabled.", "type": "Coding", "starter_code": "resource \"aws_s3_bucket\" \"secure_bucket\" {\n  # Fill in configuration\n}"},
        ],
        "Cybersecurity & Ethical Hacking": [
            {"text": "Explain how SQL Injection occurs and how Prepared Statements parameterized queries neutralize it.", "type": "Conceptual"},
            {"text": "What type of attack involves intercepting communications between two parties without authorization?", "type": "MCQ", "options": ["A) DDoS", "B) Man-In-The-Middle (MITM)", "C) Buffer Overflow", "D) XSS"], "correct_answer": "B) Man-In-The-Middle (MITM)"},
            {"text": "Write a script to check if a web server enforces HTTPS and HTTP Strict Transport Security (HSTS).", "type": "Coding", "starter_code": "import requests\n\ndef check_hsts(url):\n    # Verify HSTS header\n    pass"},
        ],
        "Data Science & Machine Learning": [
            {"text": "How do you handle severe class imbalance in a fraud detection dataset?", "type": "Conceptual"},
            {"text": "Which metric is best suited for evaluating a model when false negatives are extremely costly?", "type": "MCQ", "options": ["A) Accuracy", "B) Recall (Sensitivity)", "C) Precision", "D) R-squared"], "correct_answer": "B) Recall (Sensitivity)"},
            {"text": "Write a Python Pandas function to clean missing data and normalize numerical columns.", "type": "Coding", "starter_code": "import pandas as pd\n\ndef preprocess_df(df):\n    # Preprocess dataframe\n    return df"},
        ],
    }

    # Generic Fallbacks by Interview Type
    topic_banks = {
        "Behavioral": [
            {"text": "Tell me about a time you encountered a severe conflict in your team and how you resolved it.", "type": "Behavioral"},
            {"text": "Describe a project where requirements changed last minute. How did you adapt your architecture?", "type": "Behavioral"},
            {"text": "Give an example of a mistake you made in production and how you conducted post-mortem mitigation.", "type": "Behavioral"},
            {"text": "Tell me about a time you mentored a junior developer or helped onboard a new team member.", "type": "Behavioral"},
            {"text": "Describe a situation where you had to push back against unreasonable deadlines.", "type": "Behavioral"},
        ],
        "System Design": [
            {"text": "Design a scalable Real-time Notification System capable of delivering 10M pushes/sec.", "type": "System Design"},
            {"text": "How would you architect a global Rate Limiter service across multiple edge locations?", "type": "System Design"},
            {"text": "Explain database sharding vs partitioning strategies for high throughput write operations.", "type": "System Design"},
            {"text": "Design a Distributed URL Shortener (like Bitly) with 99.999% availability.", "type": "System Design"},
        ],
        "HR": [
            {"text": "Tell me about your career journey and what drove your interest in our engineering organization.", "type": "HR"},
            {"text": "Where do you envision your technical and leadership growth over the next 3 to 5 years?", "type": "HR"},
            {"text": "What key engineering culture values are most important to you in your daily work environment?", "type": "HR"},
            {"text": "Why are you looking to transition to a new engineering role at this stage of your career?", "type": "HR"},
        ]
    }

    # 1. Gather pool based on Domain or Topic
    raw_pool = []
    if interview_type in topic_banks and interview_type != "Technical":
        raw_pool = topic_banks[interview_type]
    elif domain in domain_banks:
        raw_pool = domain_banks[domain]
    else:
        # Fallback pool for any technical domain
        raw_pool = [
            {"text": f"Explain the core architectural principles of {domain}.", "type": "Conceptual"},
            {"text": f"Which protocol or pattern is most commonly used in modern {domain}?", "type": "MCQ", "options": ["A) Protocol A", "B) Protocol B", "C) Protocol C", "D) Protocol D"], "correct_answer": "A) Protocol A"},
            {"text": f"Write a code snippet illustrating error handling in {domain}.", "type": "Coding", "starter_code": "# Solution for " + domain + "\ndef handle_task():\n    pass"},
            {"text": f"Describe how performance optimization is benchmarked in {domain}.", "type": "Conceptual"},
            {"text": f"What is a critical security vulnerability to guard against in {domain}?", "type": "Conceptual"},
            {"text": f"Write an algorithmic function to process a list of items for {domain}.", "type": "Coding", "starter_code": "def process_data(items):\n    # Process items\n    return items"},
        ]

    # Filter or transform according to question_format if specific format requested
    filtered_pool = []
    for item in raw_pool:
        item_type = item.get("type", "Conceptual")
        if question_format == "Coding" and item_type != "Coding":
            # Generate coding problem variant
            item = {
                "text": f"[Coding Challenge] Write a solution for: {item['text']}",
                "type": "Coding",
                "starter_code": "def solution():\n    # Write your code here\n    pass"
            }
        elif question_format == "MCQ" and item_type != "MCQ":
            # Generate MCQ variant
            item = {
                "text": item['text'],
                "type": "MCQ",
                "options": [
                    f"A) Primary approach for {domain}",
                    f"B) Secondary fallback option",
                    f"C) Deprecated method",
                    f"D) None of the above"
                ],
                "correct_answer": f"A) Primary approach for {domain}"
            }
        filtered_pool.append(item)

    results = []
    for i in range(n):
        q_item = filtered_pool[i % len(filtered_pool)]
        q_dict = {
            "question_number": i + 1,
            "question_text": q_item["text"],
            "question_type": q_item.get("type", interview_type),
            "expected_keywords": [domain, interview_type],
        }
        if "options" in q_item:
            q_dict["options"] = q_item["options"]
            q_dict["correct_answer"] = q_item["correct_answer"]
        if "starter_code" in q_item:
            q_dict["starter_code"] = q_item["starter_code"]
        results.append(q_dict)

    return results

