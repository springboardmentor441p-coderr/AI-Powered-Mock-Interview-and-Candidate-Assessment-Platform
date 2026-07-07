import random

from apps.ai.providers.llm.interfaces import GeneratedQuestion, IQuestionGenerationProvider

_QUESTION_BANKS = {
    "technical": [
        "Explain the difference between {topic_a} and {topic_b} with an example.",
        "How would you optimize a slow database query in a production system?",
        "Walk me through how you would design a rate limiter for a public API.",
        "What is the time complexity of {topic_a}, and when would you avoid using it?",
        "Describe a challenging bug you fixed and how you diagnosed the root cause.",
    ],
    "hr": [
        "Tell me about yourself and why you are interested in this role.",
        "Why do you want to work at our company?",
        "What are your salary expectations for this position?",
        "Where do you see yourself in five years?",
        "What motivates you in your day-to-day work?",
    ],
    "behavioral": [
        "Describe a time you disagreed with a teammate. How did you resolve it?",
        "Tell me about a time you missed a deadline. What did you learn?",
        "Give an example of when you had to learn something quickly under pressure.",
        "Describe a situation where you had to give difficult feedback.",
        "Tell me about a time you took initiative without being asked.",
    ],
    "aptitude": [
        "If a train travels 60 km in 45 minutes, what is its speed in km/h?",
        "A is twice as old as B was when A was as old as B is now. If A is 24, how old is B?",
        "Find the next number in the sequence: 2, 6, 12, 20, 30, ?",
        "If 5 machines take 5 minutes to make 5 widgets, how long do 100 machines take to make 100 widgets?",
        "A shop offers a 20% discount, then an additional 10% off. What is the total discount?",
    ],
}

_TOPIC_PAIRS = [
    ("a list and a tuple", "a set"),
    ("SQL and NoSQL databases", "a key-value store"),
    ("multithreading", "multiprocessing"),
    ("REST and GraphQL", "gRPC"),
]


class MockQuestionGenerator(IQuestionGenerationProvider):
    def generate_questions(
        self,
        interview_type: str,
        domain: str,
        difficulty: str,
        count: int,
        candidate_skills: list[str] | None = None,
    ) -> list[GeneratedQuestion]:
        bank = _QUESTION_BANKS.get(interview_type, _QUESTION_BANKS["hr"])
        questions: list[GeneratedQuestion] = []
        skills = candidate_skills or ["the relevant technology"]

        for i in range(count):
            template = bank[i % len(bank)]
            topic_a, topic_b = random.choice(_TOPIC_PAIRS)
            text = template.format(topic_a=topic_a, topic_b=topic_b)
            questions.append(
                GeneratedQuestion(
                    text=text,
                    category=interview_type,
                    difficulty=difficulty,
                    expected_topics=[domain] + skills[:3],
                )
            )
        return questions
