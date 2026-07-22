"""
Gemini AI service for question generation and evaluation.
"""
import json
import re
from typing import Any, Optional

import google.generativeai as genai
from flask import current_app

from app.utils.constants import (
    DIFFICULTY_TO_SENIORITY,
    DOMAIN_ROLE_CONTEXT,
    DOMAIN_TECHNICAL_QUESTIONS,
    INTERVIEW_TARGET_MINUTES,
    INTERVIEWER_NAME,
    INTERVIEWER_ROLE,
)


class GeminiService:
    """Google Gemini API integration."""

    _model = None
    _configured_key = ""

    @staticmethod
    def _configure() -> bool:
        """Configure Gemini API with key from config."""
        api_key = current_app.config.get("GEMINI_API_KEY", "")
        if not api_key or api_key == "your-gemini-api-key-here":
            return False
        if GeminiService._configured_key != api_key:
            genai.configure(api_key=api_key)
            GeminiService._configured_key = api_key
            GeminiService._model = None
        return True

    @staticmethod
    def _get_model(fast_turn: bool = False):
        """
        Get Gemini generative model.

        Args:
            fast_turn: Use a lower output limit for live interviewer replies.

        Returns:
            GenerativeModel instance.
        """
        model_name = current_app.config.get("GEMINI_MODEL", "gemini-1.5-flash")
        if fast_turn:
            return genai.GenerativeModel(
                model_name,
                generation_config={
                    "temperature": 0.7,
                    "max_output_tokens": 180,
                },
            )
        if GeminiService._model is None:
            GeminiService._model = genai.GenerativeModel(model_name)
        return GeminiService._model

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
    def _resolve_role_context(domain: str, difficulty: str, job_title: str = "") -> dict:
        """
        Resolve job context fields used by the Sarah Chen interviewer persona.

        Args:
            domain: Technical domain.
            difficulty: Interview difficulty level.
            job_title: Optional interview title override.

        Returns:
            Role context dictionary.
        """
        defaults = DOMAIN_ROLE_CONTEXT.get(
            domain,
            {
                "job_title": f"{domain} Specialist",
                "company_context": f"a technology team hiring for {domain} talent",
                "key_skills": f"core {domain} skills, problem solving, and collaboration",
                "nice_to_have": "cloud familiarity, testing, and mentoring",
                "responsibilities": (
                    f"deliver {domain} work, collaborate across teams, and improve product quality"
                ),
            },
        )
        resolved_title = job_title.strip() if job_title and job_title.strip() else defaults["job_title"]
        seniority = DIFFICULTY_TO_SENIORITY.get(difficulty, "Mid")
        return {
            "domain": domain,
            "job_title": resolved_title,
            "seniority": seniority,
            "company_context": defaults["company_context"],
            "key_skills": defaults["key_skills"],
            "nice_to_have": defaults["nice_to_have"],
            "responsibilities": defaults["responsibilities"],
        }

    @staticmethod
    def _build_interviewer_persona_prompt(role_ctx: dict) -> str:
        """
        Build the Sarah Chen interviewer system prompt for the given role.

        Args:
            role_ctx: Resolved role context dictionary.

        Returns:
            Persona prompt string.
        """
        return f"""You are {INTERVIEWER_NAME}, a seasoned {INTERVIEWER_ROLE} with 12 years of experience in {role_ctx['domain']}.
You are conducting a structured mock interview for the position of **{role_ctx['job_title']}** ({role_ctx['seniority']}-level).
Company context: {role_ctx['company_context']}

YOUR PERSONALITY:
- Warm but professional. You put candidates at ease with brief small talk before diving in.
- You actively listen and respond to WHAT they actually said — never use generic filler.
- You never sound robotic or like you're reading from a script.

RESPONSE STYLE (CRITICAL — follow every time):
- NEVER start with or use stock phrases like "mm-hmm", "I see", "interesting", "that's a great approach", "thank you for sharing", or "thanks for that".
- Every acknowledgment must be UNIQUE and must reference a concrete detail from the candidate's latest answer (a project, tool, skill, decision, metric, or example they mentioned).
- Your next question must be based on that same answer — dig into a detail they raised, ask why they chose it, what happened next, or what tradeoff they faced.
- If their answer was vague, ask for a specific example tied to something they already mentioned — do not ignore their words and jump to a scripted question.
- Prefer exploring their answer over switching topics, unless the phase clearly requires moving on after a solid follow-up.

INTERVIEW STRUCTURE (aim for ~{INTERVIEW_TARGET_MINUTES} minutes total):
1. WARM-UP (1 minute):
   - Greet the candidate warmly by saying "Hi there! Thanks for joining today."
   - Ask them to briefly introduce themselves and what excites them about this role.
2. EXPERIENCE & MOTIVATION (3 minutes):
   - Ask about their current or most recent role and key achievements.
   - Ask specifically about their experience with {role_ctx['key_skills']}.
   - Probe deeper: "Can you walk me through a specific project where you used [skill]?"
   - Ask why they're interested in this particular role and what draws them to the {role_ctx['domain']} space.
3. TECHNICAL DEEP-DIVE (4 minutes):
   - Ask 2 targeted technical questions related to the core skills: {role_ctx['key_skills']}
   - Include ONE scenario-based question like: "Imagine you're tasked with [realistic scenario related to the job]. How would you approach it?"
   - Follow up on their answers — don't just move on. Ask "Why did you choose that approach?" or "What tradeoffs did you consider?"
   - If relevant, touch on nice-to-have skills: {role_ctx['nice_to_have']}
4. BEHAVIORAL (2 minutes):
   - Ask about a challenging situation: "Tell me about a time you had to [relevant challenge for this role]."
   - Ask about teamwork and collaboration style.
5. CLOSING (1 minute):
   - Ask "Do you have any questions for me about the role or team?"
   - Thank them warmly and say you'll follow up soon.

KEY RESPONSIBILITIES for this role include:
{role_ctx['responsibilities']}

IMPORTANT RULES:
- Ask ONE question at a time. Wait for a complete answer before asking the next question.
- Never list multiple questions at once.
- Adapt your follow-up questions based on what the candidate actually says.
- If a candidate gives a vague answer, gently push for specifics: "Could you give me a concrete example?"
- If they mention something interesting, explore it even if it wasn't in your plan.
- Keep the conversation flowing naturally — this should feel like a real conversation, not an interrogation.
- Speak concisely. Your questions should be 1-3 sentences max."""

    @staticmethod
    def _interview_phase_for_turn(current_turn: int, max_turns: int) -> str:
        """
        Map conversation progress to the Sarah Chen interview phase.

        Args:
            current_turn: Completed candidate responses.
            max_turns: Target exchange count.

        Returns:
            Phase name string.
        """
        if current_turn >= max_turns:
            return "CLOSING"
        progress = current_turn / max(max_turns, 1)
        if progress < 0.15:
            return "WARM-UP"
        if progress < 0.40:
            return "EXPERIENCE & MOTIVATION"
        if progress < 0.75:
            return "TECHNICAL DEEP-DIVE"
        if progress < 0.90:
            return "BEHAVIORAL"
        return "CLOSING"

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
        job_title: str = "",
    ) -> dict:
        """
        Generate a warm opening message to start a live interview.

        Args:
            domain: Technical domain.
            category: Question category.
            difficulty: Difficulty level.
            resume_context: Optional resume context.
            candidate_name: Candidate display name.
            job_title: Optional role title for the interview.

        Returns:
            Opening message dictionary.
        """
        role_ctx = GeminiService._resolve_role_context(domain, difficulty, job_title)
        if not GeminiService._configure():
            return GeminiService._fallback_opening_message(
                domain, category, difficulty, candidate_name, job_title
            )

        name_part = f"The candidate's name is {candidate_name}. " if candidate_name else ""
        resume_part = ""
        if resume_context:
            resume_part = f"Candidate Resume (you have reviewed this):\n{resume_context}"

        persona = GeminiService._build_interviewer_persona_prompt(role_ctx)
        prompt = f"""{persona}

{name_part}
Category focus: {category}, Seniority: {role_ctx['seniority']}
{resume_part}

You are starting the interview NOW (WARM-UP phase).
1. Greet warmly — begin with "Hi there! Thanks for joining today." Introduce yourself as {INTERVIEWER_NAME}.
2. If resume context is provided, briefly mention you reviewed their background.
3. Ask ONE warm-up question: ask them to briefly introduce themselves and what excites them about the {role_ctx['job_title']} role.
Do NOT ask a technical question yet. Ask only the warm-up question.

Return ONLY valid JSON:
{{
  "greeting": "warm greeting here",
  "opening_question": "single warm-up introduction question",
  "category": "HR",
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
            domain, category, difficulty, candidate_name, job_title
        )

    @staticmethod
    def _fallback_opening_message(
        domain: str,
        category: str,
        difficulty: str,
        candidate_name: str = "",
        job_title: str = "",
    ) -> dict:
        """
        Fallback opening message when Gemini is unavailable.

        Args:
            domain: Technical domain.
            category: Question category.
            difficulty: Difficulty level.
            candidate_name: Candidate display name.
            job_title: Optional role title.

        Returns:
            Opening message dictionary.
        """
        role_ctx = GeminiService._resolve_role_context(domain, difficulty, job_title)
        greeting_name = f", {candidate_name}" if candidate_name else ""
        return {
            "greeting": (
                f"Hi there{greeting_name}! Thanks for joining today. "
                f"I'm {INTERVIEWER_NAME}, {INTERVIEWER_ROLE} for our {role_ctx['job_title']} search. "
                f"I've reviewed your resume and I'm looking forward to our conversation."
            ),
            "opening_question": (
                f"Could you briefly introduce yourself and share what excites you about "
                f"this {role_ctx['job_title']} role?"
            ),
            "category": "HR",
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
        job_title: str = "",
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
            resume_context: Resume context.
            job_title: Optional role title.

        Returns:
            Interviewer response with acknowledgment and next question.
        """
        role_ctx = GeminiService._resolve_role_context(domain, difficulty, job_title)
        if not GeminiService._configure():
            return GeminiService._fallback_interviewer_response(
                conversation_history,
                domain,
                category,
                difficulty,
                current_turn,
                max_turns,
                job_title,
            )

        remaining = max_turns - current_turn
        phase = GeminiService._interview_phase_for_turn(current_turn, max_turns)
        last_turn = conversation_history[-1] if conversation_history else {}
        last_answer = (last_turn.get("answer") or "").strip()
        last_question = (last_turn.get("question") or "").strip()

        # Keep history compact for faster generation.
        history_text = "\n".join(
            [
                f"Q: {turn.get('question', '')[:220]}\nA: {turn.get('answer', '')[:320]}"
                for turn in conversation_history[-3:]
            ]
        )
        resume_snip = ""
        if resume_context:
            resume_snip = resume_context[:500]

        prompt = f"""You are {INTERVIEWER_NAME}, {INTERVIEWER_ROLE} interviewing for {role_ctx['job_title']} ({role_ctx['seniority']}-level) in {domain}.
Phase: {phase}. Turn {current_turn}/{max_turns} (remaining {remaining}).
Resume notes: {resume_snip or 'n/a'}

Recent conversation:
{history_text}

LATEST ANSWER (react to THIS):
Q: {last_question[:300]}
A: {last_answer[:500]}

Write a UNIQUE reply:
1) acknowledgment: one short sentence naming a concrete detail from their latest answer. NEVER use: mm-hmm, I see, interesting, that's great, thank you for sharing.
2) next_question: ONE follow-up based on that detail (why/how/tradeoff/example). Prefer depth over new topic.
If ending ({current_turn} >= {max_turns} or phase CLOSING): is_complete true, next_question empty, warm closing_remarks.

Return ONLY JSON:
{{"acknowledgment":"...","next_question":"...","is_complete":false,"closing_remarks":"","category":"Technical","difficulty":"{difficulty}"}}"""

        try:
            model = GeminiService._get_model(fast_turn=True)
            response = model.generate_content(prompt)
            data = GeminiService._parse_json_response(response.text)
            if "acknowledgment" in data:
                data = GeminiService._sanitize_interviewer_response(data, last_answer)
                if current_turn >= max_turns:
                    data["is_complete"] = True
                    data["next_question"] = ""
                return data
        except Exception as exc:
            current_app.logger.error(f"Gemini interviewer response failed: {exc}")

        return GeminiService._fallback_interviewer_response(
            conversation_history,
            domain,
            category,
            difficulty,
            current_turn,
            max_turns,
            job_title,
        )

    @staticmethod
    def _sanitize_interviewer_response(data: dict, last_answer: str) -> dict:
        """
        Replace generic stock acknowledgments with a contextual one when needed.

        Args:
            data: Raw interviewer response from the model.
            last_answer: Candidate's latest answer text.

        Returns:
            Sanitized interviewer response dictionary.
        """
        acknowledgment = (data.get("acknowledgment") or "").strip()
        banned_starts = (
            "mm-hmm",
            "mm hmm",
            "i see",
            "interesting",
            "that's a great",
            "that is a great",
            "thanks for sharing",
            "thank you for sharing",
            "thank you for that",
            "thanks for that",
        )
        lower_ack = acknowledgment.lower()
        is_generic = (not acknowledgment) or any(
            lower_ack.startswith(phrase) or lower_ack == phrase.rstrip()
            for phrase in banned_starts
        )
        if is_generic:
            data["acknowledgment"] = GeminiService._build_contextual_acknowledgment(
                last_answer
            )
        return data

    @staticmethod
    def _extract_answer_anchor(answer: str) -> str:
        """
        Pull a short concrete phrase from the candidate answer for follow-ups.

        Args:
            answer: Candidate answer text.

        Returns:
            Short anchor phrase, or empty string.
        """
        cleaned = re.sub(r"\s+", " ", (answer or "").strip())
        if not cleaned:
            return ""
        # Prefer a meaningful clause around the middle/start rather than filler words.
        stop = {
            "i",
            "me",
            "my",
            "we",
            "our",
            "the",
            "a",
            "an",
            "and",
            "or",
            "to",
            "of",
            "in",
            "on",
            "for",
            "with",
            "that",
            "this",
            "it",
            "was",
            "is",
            "are",
            "have",
            "had",
            "been",
            "from",
            "as",
            "at",
            "by",
            "so",
            "just",
            "really",
            "also",
            "like",
            "you",
            "your",
        }
        words = [w.strip(".,!?;:\"'()[]") for w in cleaned.split()]
        content_words = [w for w in words if w and w.lower() not in stop]
        if len(content_words) >= 4:
            return " ".join(content_words[:6])
        if len(cleaned) > 90:
            return cleaned[:90].rsplit(" ", 1)[0]
        return cleaned[:80]

    @staticmethod
    def _build_contextual_acknowledgment(answer: str) -> str:
        """
        Build a unique acknowledgment tied to the candidate's answer.

        Args:
            answer: Candidate answer text.

        Returns:
            Acknowledgment sentence.
        """
        anchor = GeminiService._extract_answer_anchor(answer)
        if not anchor:
            return "You raised a few useful points there. Let's dig into one of them."
        return f'You brought up "{anchor}" — I want to understand that better.'

    @staticmethod
    def _build_contextual_follow_up(
        answer: str,
        domain: str,
        phase: str,
        role_ctx: dict,
        fallback_pool: list[str],
        turn_index: int,
    ) -> str:
        """
        Build a follow-up question grounded in the candidate's last answer.

        Args:
            answer: Candidate answer text.
            domain: Interview domain.
            phase: Current interview phase.
            role_ctx: Role context dictionary.
            fallback_pool: Phase question pool as last resort.
            turn_index: Current turn index for pool rotation.

        Returns:
            Follow-up question string.
        """
        anchor = GeminiService._extract_answer_anchor(answer)
        if anchor:
            probes = [
                f"What made you choose that approach with {anchor}?",
                f"Can you walk me through one concrete example involving {anchor}?",
                f"What was the hardest part when working on {anchor}, and how did you handle it?",
                f"Looking back on {anchor}, what would you do differently next time?",
                f"How did {anchor} affect the outcome for your team or users?",
            ]
            return probes[turn_index % len(probes)]

        if phase == "TECHNICAL DEEP-DIVE":
            return (
                f"Could you give a concrete {domain} example from your recent work "
                f"and explain the tradeoffs you considered?"
            )
        if phase == "BEHAVIORAL":
            return (
                f"Tell me about a specific challenging moment in a {domain} project "
                f"and how you worked through it with others."
            )
        if phase == "EXPERIENCE & MOTIVATION":
            skill = role_ctx["key_skills"].split(",")[0].strip()
            return (
                f"Which recent project best shows your experience with {skill}, "
                f"and what was your exact contribution?"
            )
        if fallback_pool:
            return fallback_pool[turn_index % len(fallback_pool)]
        return f"Could you share a specific example from your {domain} experience?"

    @staticmethod
    def _fallback_interviewer_response(
        conversation_history: list[dict],
        domain: str,
        category: str,
        difficulty: str,
        current_turn: int,
        max_turns: int,
        job_title: str = "",
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
            job_title: Optional role title.

        Returns:
            Interviewer response dictionary.
        """
        role_ctx = GeminiService._resolve_role_context(domain, difficulty, job_title)
        phase = GeminiService._interview_phase_for_turn(current_turn, max_turns)
        last_answer = ""
        if conversation_history:
            last_answer = conversation_history[-1].get("answer", "") or ""

        if current_turn >= max_turns or phase == "CLOSING":
            closing_ack = GeminiService._build_contextual_acknowledgment(last_answer)
            return {
                "acknowledgment": closing_ack,
                "next_question": "",
                "is_complete": True,
                "closing_remarks": (
                    "Before we wrap up — do you have any questions for me about the role or team? "
                    "Thanks again for your time today; I'll follow up soon."
                ),
                "category": "HR",
                "difficulty": difficulty,
            }

        domain_questions = DOMAIN_TECHNICAL_QUESTIONS.get(domain, [])
        phase_questions = {
            "WARM-UP": [
                f"Could you briefly introduce yourself and what excites you about this {role_ctx['job_title']} role?"
            ],
            "EXPERIENCE & MOTIVATION": [
                "Tell me about your current or most recent role and a key achievement you're proud of.",
                f"Can you walk me through a specific project where you used {role_ctx['key_skills'].split(',')[0].strip()}?",
                f"What draws you to the {domain} space and this particular role?",
            ],
            "TECHNICAL DEEP-DIVE": domain_questions
            or [
                f"Imagine you're tasked with delivering a critical {domain} feature under a tight deadline. How would you approach it?",
                "Why did you choose that approach, and what tradeoffs did you consider?",
            ],
            "BEHAVIORAL": [
                f"Tell me about a time you had to handle a challenging situation related to {domain} work.",
                "How would you describe your teamwork and collaboration style?",
            ],
        }
        pool = phase_questions.get(phase, domain_questions) or [
            f"Could you give me a concrete example from your {domain} experience?"
        ]

        acknowledgment = GeminiService._build_contextual_acknowledgment(last_answer)
        next_question = GeminiService._build_contextual_follow_up(
            last_answer,
            domain,
            phase,
            role_ctx,
            pool,
            max(current_turn - 1, 0),
        )

        category_for_phase = {
            "WARM-UP": "HR",
            "EXPERIENCE & MOTIVATION": "HR",
            "TECHNICAL DEEP-DIVE": "Technical",
            "BEHAVIORAL": "Behavioral",
        }.get(phase, category)

        return {
            "acknowledgment": acknowledgment,
            "next_question": next_question,
            "is_complete": False,
            "closing_remarks": "",
            "category": category_for_phase,
            "difficulty": difficulty,
        }
