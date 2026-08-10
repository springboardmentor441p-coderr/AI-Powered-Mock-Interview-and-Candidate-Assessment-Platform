import re
import random
from typing import List, Optional
from app.utils.ai_client import generate_text


class FollowupEngine:
    async def generate_followup(
        self,
        question: str,
        answer: str,
        job_role: str,
        difficulty: str,
        previous_questions: List[str],
    ) -> str:
        """
        Generate one targeted follow-up question based on the candidate's answer.
        Uses Gemini API if available, falls back to keyword-targeted heuristics.
        """
        prompt = (
            f"Job Role: {job_role}\n"
            f"Difficulty: {difficulty}\n"
            f"Previous Question: {question}\n"
            f"Candidate Answer: {answer}\n\n"
            f"Create ONE, and ONLY ONE, direct, sharp follow-up question based on their answer. "
            f"Rule 1: Focus on architectural trade-offs, optimization, design decisions, or debugging their specific choice.\n"
            f"Rule 2: Never repeat questions from the history: {', '.join(previous_questions)}.\n"
            f"Rule 3: Keep it conversational, starting directly with the question text without any intros."
        )
        system_instruction = (
            "You are a Senior Technical Interviewer. Your task is to ask a brief, razor-sharp follow-up question. "
            "Examine their answer, find a technology, claim, or architectural pattern they mentioned, and drill down. "
            "For example: if they said they used 'XGBoost', ask why not 'Random Forest' or how they handled hyperparameters/overfitting. "
            "Only ask the question. Do not add comments or headings."
        )

        response = await generate_text(prompt, system_instruction)
        if response:
            return response

        # Fallback to local heuristic follow-up generator
        return self._generate_fallback(question, answer, previous_questions)

    def _generate_fallback(self, question: str, answer: str, previous_questions: List[str]) -> str:
        al = answer.lower()

        # Keyword mapping for specific technical follow-ups
        tech_followups = {
            "xgboost": [
                "Why did you choose XGBoost over Random Forest or simpler linear models for this problem?",
                "What specific hyperparameters did you tune in XGBoost to control model complexity and prevent overfitting?",
                "How does XGBoost compute feature importance under the hood? Explain gain vs cover."
            ],
            "random forest": [
                "How does Random Forest control variance, and how does bagging differ from boosting?",
                "What was the out-of-bag (OOB) error in your model, and how did you utilize it for validation?"
            ],
            "fastapi": [
                "FastAPI is built on ASGI. What is ASGI, and how does it compare to WSGI in terms of concurrency?",
                "How did you leverage FastAPI's dependency injection system, and what database session management pattern did you use?"
            ],
            "django": [
                "Django's ORM is synchronous. How did you handle asynchronous tasks or high concurrency? Did you use Celery?",
                "What database optimization techniques did you use in Django? Did you use select_related or prefetch_related?"
            ],
            "react": [
                "In React, when would you choose useMemo or useCallback, and what are the performance overheads of using them everywhere?",
                "How did you manage global state in your application, and why did you choose that specific state manager?"
            ],
            "docker": [
                "How did you optimize your Docker image size for deployment? Did you use multi-stage builds?",
                "What is the difference between a Docker container and a lightweight virtual machine?"
            ],
            "kubernetes": [
                "How did you manage stateful applications in Kubernetes? Did you use StatefulSets or persistent volume claims?",
                "What was your strategy for pod autoscaling? Did you use Horizontal Pod Autoscaler (HPA) based on CPU/Memory or custom metrics?"
            ],
            "sql": [
                "What indexing strategies did you apply on your tables? How did you resolve slow queries in database transactions?",
                "Explain the difference between a clustered and non-clustered index."
            ],
            "mongodb": [
                "Since MongoDB is schemaless, how did you handle data validation and schema migrations at the application layer?",
                "What is your strategy for replica sets and sharding in MongoDB to achieve high availability?"
            ],
            "aws": [
                "How did you secure your backend applications on AWS? Explain VPC configurations and IAM roles.",
                "Why did you choose your specific server hosting? Did you use ECS, EKS, EC2, or Serverless Lambda?"
            ]
        }

        # Check if any technology keyword is in the user's answer
        for tech, options in tech_followups.items():
            if tech in al:
                unasked = [o for o in options if o not in previous_questions]
                if unasked:
                    return random.choice(unasked)
                return random.choice(options)

        # General follow-ups based on common answer keywords
        general_options = [
            "Could you explain the biggest technical risk or limitation associated with the approach you just described?",
            "What alternative design options did you consider before settling on this solution, and why did you rule them out?",
            "If you had to debug a production performance issue in the architecture you mentioned, where would you start looking first?",
            "What metrics did you monitor to verify that this solution was performing optimally under load?"
        ]

        unasked_general = [g for g in general_options if g not in previous_questions]
        if unasked_general:
            return random.choice(unasked_general)
        return random.choice(general_options)
