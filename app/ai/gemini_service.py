"""
Gemini AI service for question generation and evaluation.
"""
import json
import re
from typing import Any, Optional

import google.generativeai as genai
from flask import current_app

from app.utils.constants import DOMAIN_TECHNICAL_QUESTIONS


class GeminiService:
    """Google Gemini API integration."""

    @staticmethod
    def _configure() -> bool:
        """Configure Gemini API with key from config."""
        api_key = current_app.config.get("GEMINI_API_KEY", "")
        if not api_key or api_key == "your-gemini-api-key-here":
            return False
        genai.configure(api_key=api_key)
        return True

    @staticmethod
    def _get_model():
        """Get Gemini generative model."""
        return genai.GenerativeModel("gemini-1.5-flash")

    @staticmethod
    def _parse_json_response(text: str) -> dict:
        """Extract JSON from Gemini response text."""
        text = text.strip()
        json_match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
        if json_match:
            text = json_match.group(1)
        else:
            brace_match = re.search(r"\{.*\}", text, re.DOTALL)
            if brace_match:
                text = brace_match.group(0)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"raw_response": text}

    @staticmethod
    def generate_interview_questions(
        domain: str,
        category: str,
        difficulty: str,
        count: int = 5,
        resume_summary: str = "",
    ) -> list[dict]:
        """
        Generate interview questions using Gemini.

        Args:
            domain: Technical domain.
            category: Question category.
            difficulty: Difficulty level.
            count: Number of questions.
            resume_summary: Optional resume context.

        Returns:
            List of question dictionaries.
        """
        if not GeminiService._configure():
            return GeminiService._fallback_questions(domain, category, difficulty, count)

        prompt = f"""Generate exactly {count} {difficulty} level {category} interview questions 
for a {domain} domain candidate.

{f"Resume context: {resume_summary}" if resume_summary else ""}

Return ONLY valid JSON in this format:
{{
  "questions": [
    {{
      "question_text": "question here",
      "category": "{category}",
      "difficulty": "{difficulty}",
      "time_limit_seconds": 120
    }}
  ]
}}"""

        try:
            model = GeminiService._get_model()
            response = model.generate_content(prompt)
            data = GeminiService._parse_json_response(response.text)
            questions = data.get("questions", [])
            if questions:
                return questions
        except Exception as exc:
            current_app.logger.error(f"Gemini question generation failed: {exc}")

        return GeminiService._fallback_questions(domain, category, difficulty, count)

    @staticmethod
    def _fallback_questions(
        domain: str, category: str, difficulty: str, count: int
    ) -> list[dict]:
        """Fallback questions when Gemini is unavailable."""
        templates = {
            "Technical": [
                f"Explain key concepts in {domain} and how you have applied them.",
                f"Describe a challenging {domain} problem you solved recently.",
                f"What are the best practices you follow when working with {domain}?",
                f"How do you debug issues in a {domain} project?",
                f"Compare two important tools/frameworks in {domain}.",
            ],
            "HR": [
                "Tell me about yourself and your career goals.",
                "Why are you interested in this role?",
                "Describe your ideal work environment.",
                "What are your salary expectations?",
                "When can you join if selected?",
            ],
            "Behavioral": [
                "Describe a time you handled conflict in a team.",
                "Tell me about a project where you showed leadership.",
                "How do you handle tight deadlines?",
                "Describe a failure and what you learned.",
                "How do you adapt to new technologies?",
            ],
            "Aptitude": [
                "If a task takes 4 hours for 2 people, how long for 3 people?",
                "A train travels 120km in 2 hours. What is its speed?",
                "Find the next number in sequence: 2, 6, 12, 20, ?",
                "If 30% of a number is 45, what is the number?",
                "A product costs $80 after 20% discount. Original price?",
            ],
        }
        base = templates.get(category, templates["Technical"])
        return [
            {
                "question_text": base[i % len(base)],
                "category": category,
                "difficulty": difficulty,
                "time_limit_seconds": 120,
            }
            for i in range(count)
        ]

    @staticmethod
    def evaluate_interview(
        questions_answers: list[dict],
        domain: str,
        resume_summary: str = "",
    ) -> dict:
        """
        Evaluate interview responses using Gemini.

        Args:
            questions_answers: List of Q&A pairs with analysis data.
            domain: Interview domain.
            resume_summary: Resume context.

        Returns:
            Evaluation result dictionary.
        """
        if not GeminiService._configure():
            return GeminiService._fallback_evaluation(questions_answers)

        qa_text = "\n".join(
            [
                f"Q: {qa['question']}\nA: {qa['answer']}\n"
                f"Speech Score: {qa.get('speech_score', 'N/A')}\n"
                f"Confidence: {qa.get('confidence_score', 'N/A')}"
                for qa in questions_answers
            ]
        )

        prompt = f"""You are an expert interview evaluator for {domain} positions.

Resume: {resume_summary or 'Not provided'}

Interview Transcript:
{qa_text}

Evaluate the candidate and return ONLY valid JSON:
{{
  "technical_score": 0-100,
  "communication_score": 0-100,
  "confidence_score": 0-100,
  "professionalism_score": 0-100,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "recommended_courses": ["course1", "course2"],
  "recommended_skills": ["skill1", "skill2"],
  "ai_feedback": "detailed feedback paragraph"
}}"""

        try:
            model = GeminiService._get_model()
            response = model.generate_content(prompt)
            data = GeminiService._parse_json_response(response.text)
            if "technical_score" in data:
                return data
        except Exception as exc:
            current_app.logger.error(f"Gemini evaluation failed: {exc}")

        return GeminiService._fallback_evaluation(questions_answers)

    @staticmethod
    def _fallback_evaluation(questions_answers: list[dict]) -> dict:
        """Rule-based fallback evaluation."""
        answer_count = len(questions_answers)
        avg_length = sum(len(qa.get("answer", "")) for qa in questions_answers) / max(
            answer_count, 1
        )
        speech_scores = [
            qa.get("speech_score", 70) for qa in questions_answers if qa.get("speech_score")
        ]
        conf_scores = [
            qa.get("confidence_score", 70)
            for qa in questions_answers
            if qa.get("confidence_score")
        ]

        comm = sum(speech_scores) / len(speech_scores) if speech_scores else 70
        conf = sum(conf_scores) / len(conf_scores) if conf_scores else 70
        tech = min(95, 50 + avg_length / 5)
        prof = 75

        return {
            "technical_score": round(tech, 1),
            "communication_score": round(comm, 1),
            "confidence_score": round(conf, 1),
            "professionalism_score": prof,
            "strengths": [
                "Demonstrated willingness to answer all questions",
                "Shows basic understanding of the domain",
            ],
            "weaknesses": [
                "Could provide more detailed technical examples",
                "Practice structuring answers using STAR method",
            ],
            "suggestions": [
                "Review core concepts in your domain",
                "Practice mock interviews regularly",
                "Work on concise and clear communication",
            ],
            "recommended_courses": [
                "Communication Skills for Professionals",
                f"Advanced {questions_answers[0].get('domain', 'Technical')} Bootcamp",
            ],
            "recommended_skills": [
                "Problem Solving",
                "System Design",
                "Public Speaking",
            ],
            "ai_feedback": (
                "The candidate completed the interview session. "
                "Based on response length and delivery metrics, there is room "
                "for improvement in technical depth and communication clarity. "
                "Continued practice with mock interviews is recommended."
            ),
        }

    @staticmethod
    def generate_resume_summary(resume_text: str, skills: list[str]) -> str:
        """
        Generate AI resume summary.

        Args:
            resume_text: Raw resume text.
            skills: Extracted skills list.

        Returns:
            Summary string.
        """
        if not GeminiService._configure():
            return (
                f"Professional with skills in {', '.join(skills[:5]) if skills else 'various areas'}. "
                "Experienced candidate seeking opportunities to grow."
            )

        prompt = f"""Summarize this resume in 3-4 professional sentences:

{resume_text[:3000]}

Skills: {', '.join(skills[:15])}

Return only the summary text, no JSON."""

        try:
            model = GeminiService._get_model()
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception:
            return (
                f"Professional with skills in {', '.join(skills[:5]) if skills else 'various areas'}."
            )

    @staticmethod
    def suggest_missing_skills(
        current_skills: list[str], domain: str
    ) -> list[str]:
        """
        Suggest skills missing from resume for target domain.

        Args:
            current_skills: Skills found in resume.
            domain: Target domain.

        Returns:
            List of missing skill suggestions.
        """
        domain_skills = {
            "Python": ["Django", "Flask", "FastAPI", "Pandas", "NumPy", "SQL", "Git", "Docker"],
            "Java": ["Spring Boot", "Hibernate", "Maven", "JUnit", "Microservices", "SQL"],
            "AI": ["TensorFlow", "PyTorch", "NLP", "Computer Vision", "Deep Learning"],
            "Machine Learning": [
                "Scikit-learn", "TensorFlow", "Feature Engineering", "Model Deployment",
            ],
            "Data Science": ["Python", "SQL", "Pandas", "Tableau", "Statistics", "ML"],
            "Cloud": ["AWS", "Azure", "Docker", "Kubernetes", "CI/CD", "Terraform"],
        }
        expected = domain_skills.get(domain, ["Communication", "Problem Solving", "Teamwork"])
        current_lower = {s.lower() for s in current_skills}
        missing = [s for s in expected if s.lower() not in current_lower]
        return missing[:8]

    @staticmethod
    def generate_opening_message(
        domain: str,
        category: str,
        difficulty: str,
        resume_context: str = "",
        candidate_name: str = "",
    ) -> dict:
        """
        Generate a warm opening message to start a live interview.

        Args:
            domain: Technical domain.
            category: Question category.
            difficulty: Difficulty level.
            resume_summary: Optional resume context.
            candidate_name: Candidate display name.

        Returns:
            Opening message dictionary.
        """
        if not GeminiService._configure():
            return GeminiService._fallback_opening_message(
                domain, category, difficulty, candidate_name
            )

        name_part = f"The candidate's name is {candidate_name}. " if candidate_name else ""
        domain_questions = DOMAIN_TECHNICAL_QUESTIONS.get(domain, [])
        sample_questions = "\n".join(f"- {q}" for q in domain_questions[:3])
        resume_part = ""
        if resume_context:
            resume_part = f"Candidate Resume (you have reviewed this):\n{resume_context}"

        prompt = f"""You are a {domain} technical interviewer Alex conducting a LIVE video interview.
{name_part}
Category: {category}, Difficulty: {difficulty}
{resume_part}

Sample {domain} technical questions for inspiration:
{sample_questions}

Start naturally like a real interviewer on a video call:
1. Brief warm greeting — mention you have reviewed their resume if resume is provided
2. One opening question — prefer a {domain}-specific TECHNICAL question based on their resume skills/projects

Return ONLY valid JSON:
{{
  "greeting": "warm greeting here",
  "opening_question": "domain-specific technical opening question",
  "category": "Technical",
  "difficulty": "{difficulty}"
}}"""

        try:
            model = GeminiService._get_model()
            response = model.generate_content(prompt)
            data = GeminiService._parse_json_response(response.text)
            if data.get("opening_question"):
                return data
        except Exception as exc:
            current_app.logger.error(f"Gemini opening message failed: {exc}")

        return GeminiService._fallback_opening_message(
            domain, category, difficulty, candidate_name
        )

    @staticmethod
    def _fallback_opening_message(
        domain: str,
        category: str,
        difficulty: str,
        candidate_name: str = "",
    ) -> dict:
        """
        Fallback opening message when Gemini is unavailable.

        Args:
            domain: Technical domain.
            category: Question category.
            difficulty: Difficulty level.
            candidate_name: Candidate display name.

        Returns:
            Opening message dictionary.
        """
        greeting_name = f", {candidate_name}" if candidate_name else ""
        domain_questions = DOMAIN_TECHNICAL_QUESTIONS.get(domain, [])
        opening_question = (
            domain_questions[0]
            if domain_questions
            else f"Tell me about your background in {domain} and a technical project you worked on."
        )

        return {
            "greeting": (
                f"Hi{greeting_name}! Thanks for joining today. "
                f"I'm Alex, your {domain} interviewer. I've reviewed your resume."
            ),
            "opening_question": opening_question,
            "category": "Technical",
            "difficulty": difficulty,
        }

    @staticmethod
    def generate_interviewer_response(
        conversation_history: list[dict],
        domain: str,
        category: str,
        difficulty: str,
        current_turn: int,
        max_turns: int,
        resume_context: str = "",
    ) -> dict:
        """
        Generate the next interviewer response based on conversation history.

        Args:
            conversation_history: List of prior Q&A turns.
            domain: Interview domain.
            category: Question category.
            difficulty: Difficulty level.
            current_turn: Number of completed candidate responses.
            max_turns: Target number of exchanges.
            resume_summary: Resume context.

        Returns:
            Interviewer response with acknowledgment and next question.
        """
        if not GeminiService._configure():
            return GeminiService._fallback_interviewer_response(
                conversation_history, domain, category, difficulty, current_turn, max_turns
            )

        history_text = "\n".join(
            [
                f"Interviewer: {turn.get('question', '')}\nCandidate: {turn.get('answer', '')}"
                for turn in conversation_history
            ]
        )

        remaining = max_turns - current_turn
        domain_questions = DOMAIN_TECHNICAL_QUESTIONS.get(domain, [])
        sample_questions = "\n".join(f"- {q}" for q in domain_questions)
        resume_part = ""
        if resume_context:
            resume_part = f"Candidate Resume:\n{resume_context}"

        prompt = f"""You are Alex, a professional LIVE technical interviewer for {domain} ({difficulty} level).
You are on a video call. Respond naturally — acknowledge what the candidate said, then ask a relevant follow-up.
{resume_part}

{domain} Technical Question Bank (use these for follow-ups):
{sample_questions}

Conversation so far:
{history_text}

Completed exchanges: {current_turn} of {max_turns}. Remaining: {remaining}.

Rules:
- Sound conversational, not like a written exam
- At least 70% of questions must be {domain}-specific TECHNICAL questions
- Reference specifics from the candidate's resume (skills, projects, experience) when possible
- Reference specifics from the candidate's last answer when possible
- Ask ONE clear follow-up question (unless ending)
- Mix technical depth questions with practical scenario questions for {domain}
- Set is_complete to true when {current_turn} >= {max_turns}
- If is_complete, provide warm closing_remarks and leave next_question empty

Return ONLY valid JSON:
{{
  "acknowledgment": "brief natural reaction to their answer",
  "next_question": "domain-specific technical follow-up or empty string if ending",
  "is_complete": false,
  "closing_remarks": "warm closing if is_complete, else empty",
  "category": "Technical",
  "difficulty": "{difficulty}"
}}"""

        try:
            model = GeminiService._get_model()
            response = model.generate_content(prompt)
            data = GeminiService._parse_json_response(response.text)
            if "acknowledgment" in data:
                if current_turn >= max_turns:
                    data["is_complete"] = True
                    data["next_question"] = ""
                return data
        except Exception as exc:
            current_app.logger.error(f"Gemini interviewer response failed: {exc}")

        return GeminiService._fallback_interviewer_response(
            conversation_history, domain, category, difficulty, current_turn, max_turns
        )

    @staticmethod
    def _fallback_interviewer_response(
        conversation_history: list[dict],
        domain: str,
        category: str,
        difficulty: str,
        current_turn: int,
        max_turns: int,
    ) -> dict:
        """
        Rule-based fallback for conversational interviewer responses.

        Args:
            conversation_history: Prior conversation turns.
            domain: Interview domain.
            category: Question category.
            difficulty: Difficulty level.
            current_turn: Completed response count.
            max_turns: Target exchange count.

        Returns:
            Interviewer response dictionary.
        """
        if current_turn >= max_turns:
            return {
                "acknowledgment": "Thank you for those thoughtful responses.",
                "next_question": "",
                "is_complete": True,
                "closing_remarks": (
                    "That wraps up our conversation today. You shared some great insights. "
                    "We'll process your interview and share detailed feedback shortly."
                ),
                "category": category,
                "difficulty": difficulty,
            }

        domain_questions = DOMAIN_TECHNICAL_QUESTIONS.get(domain, [])
        if domain_questions:
            pool = domain_questions
        else:
            pool = [
                f"Can you walk me through a specific technical decision you made in a {domain} project?",
                f"What trade-offs did you consider when architecting a {domain} solution?",
                f"How do you stay current with developments in {domain}?",
                f"Describe how you would debug a production issue in a {domain} application.",
            ]

        last_answer = conversation_history[-1].get("answer", "") if conversation_history else ""
        acknowledgment = (
            "I appreciate the technical detail in your answer."
            if len(last_answer) > 80
            else "Thanks for sharing that."
        )

        return {
            "acknowledgment": acknowledgment,
            "next_question": pool[(current_turn - 1) % len(pool)],
            "is_complete": False,
            "closing_remarks": "",
            "category": "Technical",
            "difficulty": difficulty,
        }
