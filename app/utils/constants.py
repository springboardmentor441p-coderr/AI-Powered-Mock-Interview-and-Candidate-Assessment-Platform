"""
Application-wide constants.
"""

# User roles
ROLE_ADMIN = "admin"
ROLE_RECRUITER = "recruiter"
ROLE_CANDIDATE = "candidate"

ROLES: list[str] = [ROLE_ADMIN, ROLE_RECRUITER, ROLE_CANDIDATE]

# Interview question categories
CATEGORY_HR = "HR"
CATEGORY_TECHNICAL = "Technical"
CATEGORY_BEHAVIORAL = "Behavioral"
CATEGORY_APTITUDE = "Aptitude"

QUESTION_CATEGORIES: list[str] = [
    CATEGORY_HR,
    CATEGORY_TECHNICAL,
    CATEGORY_BEHAVIORAL,
    CATEGORY_APTITUDE,
]

# Difficulty levels
DIFFICULTY_EASY = "Easy"
DIFFICULTY_MEDIUM = "Medium"
DIFFICULTY_HARD = "Hard"

DIFFICULTY_LEVELS: list[str] = [DIFFICULTY_EASY, DIFFICULTY_MEDIUM, DIFFICULTY_HARD]

# Domains
DOMAINS: list[str] = [
    "Python",
    "Java",
    "C++",
    "AI",
    "Machine Learning",
    "Data Science",
    "MERN",
    "Cyber Security",
    "Cloud",
]

# Emotion labels
EMOTION_HAPPY = "Happy"
EMOTION_NEUTRAL = "Neutral"
EMOTION_SAD = "Sad"
EMOTION_NERVOUS = "Nervous"

EMOTIONS: list[str] = [EMOTION_HAPPY, EMOTION_NEUTRAL, EMOTION_SAD, EMOTION_NERVOUS]

# Score weights for overall calculation
WEIGHT_COMMUNICATION = 0.30
WEIGHT_CONFIDENCE = 0.25
WEIGHT_TECHNICAL = 0.30
WEIGHT_PROFESSIONALISM = 0.15

# Interview status
INTERVIEW_SCHEDULED = "scheduled"
INTERVIEW_IN_PROGRESS = "in_progress"
INTERVIEW_COMPLETED = "completed"
INTERVIEW_CANCELLED = "cancelled"

# Filler words for speech analysis
FILLER_WORDS: list[str] = [
    "um",
    "uh",
    "like",
    "you know",
    "basically",
    "actually",
    "literally",
    "sort of",
    "kind of",
    "i mean",
    "right",
    "so",
]

# Default number of questions per interview
DEFAULT_QUESTION_COUNT = 5

# Conversational interview settings
INTERVIEW_MODE_CONVERSATIONAL = "conversational"
INTERVIEWER_NAME = "Sarah Chen"
INTERVIEWER_ROLE = "Senior Technical Hiring Manager"
MIN_CONVERSATION_TURNS = 3
MAX_CONVERSATION_TURNS = 10
SILENCE_AUTO_SUBMIT_MS = 4000
SESSION_DURATION_MULTIPLIER = 3
INTERVIEW_TARGET_MINUTES = 10

# Map interview difficulty to seniority label used in the interviewer persona
DIFFICULTY_TO_SENIORITY: dict[str, str] = {
    "Easy": "Junior",
    "Medium": "Mid",
    "Hard": "Senior",
}

# Default company / role context per domain for the Sarah Chen interviewer
DOMAIN_ROLE_CONTEXT: dict[str, dict[str, str]] = {
    "Python": {
        "job_title": "Python Developer",
        "company_context": "a product engineering team building scalable backend services",
        "key_skills": "Python, APIs, databases, testing, and clean code",
        "nice_to_have": "Flask/Django, async programming, cloud deployment",
        "responsibilities": "design and ship backend features, write reliable services, collaborate with product and QA",
    },
    "Java": {
        "job_title": "Java Developer",
        "company_context": "an enterprise engineering organization focused on reliable distributed systems",
        "key_skills": "Java, OOP, Spring Boot, REST APIs, and concurrency",
        "nice_to_have": "microservices, messaging, cloud-native patterns",
        "responsibilities": "build and maintain Java services, design APIs, improve system reliability",
    },
    "C++": {
        "job_title": "C++ Software Engineer",
        "company_context": "a performance-critical systems team",
        "key_skills": "C++, memory management, data structures, and performance optimization",
        "nice_to_have": "multithreading, modern C++17/20, tooling and profiling",
        "responsibilities": "implement high-performance components, profile bottlenecks, ensure memory safety",
    },
    "AI": {
        "job_title": "AI Engineer",
        "company_context": "an applied AI team shipping intelligent product features",
        "key_skills": "machine learning fundamentals, model evaluation, Python, and applied AI systems",
        "nice_to_have": "LLMs, MLOps, vector search, prompt engineering",
        "responsibilities": "prototype and productionize AI features, evaluate models, partner with product teams",
    },
    "Machine Learning": {
        "job_title": "Machine Learning Engineer",
        "company_context": "a data-driven product company focused on predictive systems",
        "key_skills": "supervised learning, feature engineering, model evaluation, and Python ML stack",
        "nice_to_have": "deep learning, MLOps, experiment tracking",
        "responsibilities": "train and deploy models, improve feature pipelines, monitor model quality",
    },
    "Data Science": {
        "job_title": "Data Scientist",
        "company_context": "an analytics-driven organization turning data into product decisions",
        "key_skills": "EDA, statistics, SQL, Python, and storytelling with data",
        "nice_to_have": "A/B testing, dashboards, ML prototypes",
        "responsibilities": "analyze complex datasets, communicate insights, partner with stakeholders on decisions",
    },
    "MERN": {
        "job_title": "Full-Stack MERN Developer",
        "company_context": "a product team shipping customer-facing web applications",
        "key_skills": "MongoDB, Express, React, Node.js, and REST APIs",
        "nice_to_have": "TypeScript, state management, CI/CD, cloud hosting",
        "responsibilities": "build end-to-end features, design APIs, improve UI performance and reliability",
    },
    "Cyber Security": {
        "job_title": "Cybersecurity Analyst",
        "company_context": "a security team protecting applications and infrastructure",
        "key_skills": "threat detection, vulnerability assessment, networking fundamentals, and secure coding awareness",
        "nice_to_have": "penetration testing, SIEM, cloud security",
        "responsibilities": "assess risks, investigate incidents, harden systems, advise engineering on secure practices",
    },
    "Cloud": {
        "job_title": "Cloud Engineer",
        "company_context": "a platform team running cloud-native infrastructure",
        "key_skills": "AWS/Azure, containers, CI/CD, networking, and infrastructure as code",
        "nice_to_have": "Kubernetes, observability, cost optimization",
        "responsibilities": "design resilient cloud architectures, automate deployments, improve reliability and cost",
    },
}

# Interviewer response types
RESPONSE_TYPE_OPENING = "opening"
RESPONSE_TYPE_FOLLOW_UP = "follow_up"
RESPONSE_TYPE_CLOSING = "closing"

# Interview session status labels
STATUS_LISTENING = "Listening"
STATUS_PROCESSING = "Processing"
STATUS_INTERVIEWER_SPEAKING = "Interviewer Speaking"
STATUS_READY = "Ready"

# Content moderation
MODERATION_CANCELLATION_MESSAGE = (
    "Your interview has been cancelled due to the use of inappropriate "
    "or sensitive language. Please maintain professional conduct."
)

PROFANITY_WORDS: list[str] = [
    "damn",
    "hell",
    "crap",
    "shit",
    "fuck",
    "fucking",
    "fucker",
    "bitch",
    "bastard",
    "asshole",
    "dick",
    "piss",
    "bullshit",
    "wtf",
    "stfu",
    "screw you",
    "go to hell",
]

SENSITIVE_WORDS: list[str] = [
    "kill",
    "murder",
    "suicide",
    "racist",
    "racism",
    "sexist",
    "harassment",
    "threat",
    "bomb",
    "terrorist",
    "nazi",
    "slur",
    "hate speech",
    "discriminate",
    "violent",
]

# Domain-specific technical interview questions
DOMAIN_TECHNICAL_QUESTIONS: dict[str, list[str]] = {
    "Python": [
        "Explain the difference between a list and a tuple in Python. When would you use each?",
        "How does Python's GIL affect multi-threaded applications?",
        "Describe how decorators work in Python with a real-world use case.",
        "What are Python generators and why are they memory-efficient?",
        "How do you handle exceptions and logging in a production Python application?",
        "Explain the difference between Flask and Django for web development.",
    ],
    "Java": [
        "Explain the core principles of Object-Oriented Programming in Java.",
        "What is the difference between HashMap and ConcurrentHashMap?",
        "How does Spring Boot auto-configuration work?",
        "Describe the Java memory model and garbage collection process.",
        "What are Java streams and how do they improve code readability?",
        "How would you design a RESTful API using Spring Boot?",
    ],
    "C++": [
        "Explain the difference between stack and heap memory allocation in C++.",
        "What are smart pointers and why are they preferred over raw pointers?",
        "Describe virtual functions and polymorphism in C++.",
        "How do you manage memory safely in modern C++?",
        "What is the difference between std::vector and std::list?",
        "Explain move semantics and rvalue references in C++11.",
    ],
    "AI": [
        "Explain the difference between supervised and unsupervised learning.",
        "What is overfitting and how do you prevent it in machine learning models?",
        "Describe how a neural network learns through backpropagation.",
        "What are transformers and why are they important in modern AI?",
        "How do you evaluate the performance of a classification model?",
        "Explain the bias-variance tradeoff with a practical example.",
    ],
    "Machine Learning": [
        "What is cross-validation and why is it important?",
        "Explain precision, recall, and F1-score with a real scenario.",
        "How does gradient descent optimize machine learning models?",
        "Describe feature engineering techniques you have used.",
        "What is the difference between bagging and boosting?",
        "How would you handle imbalanced datasets in classification?",
    ],
    "Data Science": [
        "Walk me through your approach to exploratory data analysis.",
        "How do you handle missing data in a dataset?",
        "Explain the difference between correlation and causation.",
        "What visualization techniques do you use to communicate insights?",
        "Describe a data pipeline you built from ingestion to reporting.",
        "How do you validate the quality of data before analysis?",
    ],
    "MERN": [
        "Explain the MERN stack architecture and how each component interacts.",
        "How does React's virtual DOM improve performance?",
        "Describe how JWT authentication works in a Node.js API.",
        "What is the difference between SQL and MongoDB for this stack?",
        "How do you manage state in a large React application?",
        "Explain middleware in Express.js with a practical example.",
    ],
    "Cyber Security": [
        "Explain the CIA triad in information security.",
        "What is the difference between symmetric and asymmetric encryption?",
        "How would you respond to a suspected data breach?",
        "Describe common OWASP Top 10 vulnerabilities and mitigations.",
        "What is penetration testing and how is it conducted?",
        "Explain how firewalls and IDS/IPS systems protect a network.",
    ],
    "Cloud": [
        "Explain the difference between IaaS, PaaS, and SaaS.",
        "How do you design a highly available architecture on AWS or Azure?",
        "What is containerization and how does Kubernetes orchestrate containers?",
        "Describe CI/CD pipeline best practices for cloud deployments.",
        "How do you manage infrastructure as code?",
        "Explain cloud cost optimization strategies you have applied.",
    ],
}

# Resume upload messages
RESUME_REQUIRED_MESSAGE = "Please upload your resume or select an existing one before starting."
RESUME_UPLOAD_SUCCESS = "Resume uploaded and linked to your interview."
