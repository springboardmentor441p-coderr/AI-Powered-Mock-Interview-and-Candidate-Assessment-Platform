"""
Core Interview Engine.

Responsible for:
- Starting an interview
- Processing candidate answers
- Evaluating answers
- Generating the next question
- Maintaining interview flow
- Generating final feedback
"""

from __future__ import annotations

import logging
import json
import re
from difflib import SequenceMatcher

from app.services.interview_scorer import InterviewScorer
from app.services.interview_state import interview_state
from app.services.scoring_engine import ScoringEngine
from app.services.time_manager import TimeManager
from app.services.interview_prompts import (
    build_answer_evaluation_prompt,
    build_feedback_prompt,
)
from app.services.groq_service import (
    chat_with_groq,
    parse_llm_json_response,
)
from app.services.prompt_builder import (
    build_prompt,
    get_job_context,
    get_stage_plan,
    get_stage_topic,
    normalize_interview_type,
)
from app.models.interview_models import (
    AnswerEvaluation,
    EvaluationDimension,
    InterviewFeedback,
    PendingAnswer,
    QuestionEvaluation,
)


logger = logging.getLogger(__name__)


class InterviewAgent:
    """
    Main Interview Engine.

    Controls the interview lifecycle from start to finish.
    """

    def __init__(self) -> None:
        """
        Initialize the interview agent.
        """
        self.state = interview_state


    def start_interview(
        self,
        *,
        resume: dict,
        job_role: str,
        interview_type: str = "technical",
        max_questions: int = 10,
        interview_duration: int = 15,
    ) -> tuple[str, str]:
        """
        Start a new interview session.

        Creates a session, stores the candidate's resume,
        and generates the first interview question.

        Returns:
            tuple(session_id, first_question)
        """

        candidate_name = resume.get("name") or "Candidate"
        normalized_type = normalize_interview_type(interview_type)

        # Create interview session
        session = interview_state.create_session(
            candidate_name=candidate_name,
            job_role=job_role,
            interview_type=normalized_type,
            resume=resume,
            max_questions=max_questions,
            interview_duration=interview_duration,
        )

        # First stage
        session.current_stage = get_stage_plan(normalized_type)[0]
        session.current_topic = get_stage_topic(session.current_stage)

        # First interview question
        first_question = self._build_opening_question(
            candidate_name=candidate_name,
            interview_type=normalized_type,
        )

        # Save question
        interview_state.add_question(
            session.session_id,
            first_question,
        )

        interview_state.add_assistant_message(
            session.session_id,
            first_question,
        )

        logger.info(
            "Interview session created: %s",
            session.session_id,
        )

        return (
            session.session_id,
            first_question,
        )


    def submit_answer(
        self,
        *,
        session_id: str,
        answer: str,
    ) -> dict[str, object]:
        """
        Process a candidate's answer and return the next interview question.

        Returns:
            (next_question, interview_completed)
        """

        session = self.state.get_session(session_id)

        if session.completed:
            raise ValueError("Interview has already been completed.")

        TimeManager.update_session_time(session)
        if TimeManager.is_time_expired(session):
            return self._complete_interview(
                session,
                "The allotted interview time has ended. Thank you for your time.",
            )

        answering_closing_question = session.current_stage == "CLOSING"

        # ---------------------------------------------------------
        # Save candidate answer
        # ---------------------------------------------------------
        self.state.add_candidate_message(
            session_id=session_id,
            message=answer,
        )

        # Keep a snapshot for deferred scoring. Answer evaluation is intentionally
        # performed only when the final report is requested, keeping live turns fast.
        session.pending_answers.append(PendingAnswer(
            question=session.questions_asked[-1],
            answer=answer,
            stage=session.current_stage,
            difficulty=session.difficulty,
        ))
        session.metrics.answered_questions = len(session.pending_answers)
        TimeManager.update_session_time(session)

        # ---------------------------------------------------------
        # Check interview completion
        # ---------------------------------------------------------
        remaining = TimeManager.calculate_timing(session)["remaining_seconds"]
        if (
            self.state.reached_question_limit(session_id)
            or answering_closing_question
            or remaining <= TimeManager.MIN_QUESTION_TIME_SECONDS
        ):
            return self._complete_interview(
                session,
                "Thank you for your time. The interview has been completed.",
            )

        if TimeManager.get_time_mode(remaining) == "WRAP_UP":
            session.current_stage = "CLOSING"
            session.current_topic = get_stage_topic("CLOSING")
            next_question = (
                "Before we conclude, what is the most important strength or experience "
                "you would like the interviewer to remember?"
            )

        # ---------------------------------------------------------
        # Decide whether to ask a follow-up question
        # ---------------------------------------------------------
        else:
            self._advance_stage(session)
            next_question = self._generate_next_question_safely(
                session=session,
                candidate_answer=answer,
            )

        # ---------------------------------------------------------
        # Store interviewer message
        # ---------------------------------------------------------
        self.state.add_question(
            session_id,
            next_question,
        )

        self.state.add_assistant_message(
            session_id,
            next_question,
        )

        logger.info(
            "Next question generated for session %s",
            session_id,
        )

        return {
            "session_id": session.session_id,
            "question_number": session.question_count,
            "current_stage": session.current_stage,
            "current_topic": session.current_topic,
            "question": next_question,
            "completed": False,
            **self._live_metrics(session),
        }

    @staticmethod
    def _record_question_evaluation_safely(
        *,
        session,
        question: str,
        answer: str,
        evaluation: AnswerEvaluation,
    ) -> QuestionEvaluation:
        """Record a usable evaluation even if an optional analyzer fails."""
        try:
            question_evaluation = ScoringEngine.evaluate_question(
                session=session,
                question=question,
                answer=answer,
                llm_raw_eval=evaluation.model_dump(),
            )
        except Exception:  # noqa: BLE001 - scoring must not abort the interview
            logger.exception(
                "Detailed scoring failed for session %s; using LLM score fallback.",
                session.session_id,
            )
            technical = max(0.0, min(100.0, float(evaluation.technical * 10)))
            communication = max(0.0, min(100.0, float(evaluation.communication * 10)))
            confidence = max(0.0, min(100.0, float(evaluation.confidence * 10)))
            professionalism = max(
                0.0,
                min(100.0, float(evaluation.problem_solving * 10)),
            )
            overall = ScoringEngine.calculate_overall_score(
                communication=communication,
                technical=technical,
                confidence=confidence,
                professionalism=professionalism,
            )
            reasoning = evaluation.reason or "Fallback evaluation."
            question_evaluation = QuestionEvaluation(
                question_number=session.question_count,
                question=question,
                answer=answer,
                stage=session.current_stage,
                difficulty=session.difficulty,
                communication=EvaluationDimension(
                    score=communication,
                    reasoning=reasoning,
                ),
                technical=EvaluationDimension(
                    score=technical,
                    reasoning=reasoning,
                ),
                confidence=EvaluationDimension(
                    score=confidence,
                    reasoning=reasoning,
                ),
                professionalism=EvaluationDimension(
                    score=professionalism,
                    reasoning=reasoning,
                ),
                overall_score=overall,
                performance_rating=ScoringEngine.classify_performance_rating(overall),
                needs_followup=evaluation.needs_followup,
            )

        ScoringEngine.update_session_scores(session, question_evaluation)
        return question_evaluation

    def _complete_interview(self, session, message: str) -> dict[str, object]:
        """Mark a session complete and return its final interviewer turn."""
        self.state.mark_completed(session.session_id)
        TimeManager.update_session_time(session)
        self.state.add_assistant_message(session.session_id, message)
        return {
            "session_id": session.session_id,
            "question_number": session.question_count,
            "current_stage": session.current_stage,
            "current_topic": session.current_topic,
            "question": message,
            "completed": True,
            **self._live_metrics(session),
        }

    def _generate_next_question_safely(
        self,
        *,
        session,
        candidate_answer: str,
    ) -> str:
        """Keep an active interview moving when next-question generation fails."""
        try:
            return self.generate_next_question(
                session=session,
                candidate_answer=candidate_answer,
            )
        except Exception:  # noqa: BLE001 - the deterministic fallback is intentional
            logger.exception(
                "Next-question generation failed for session %s; using fallback.",
                session.session_id,
            )
            return self._build_contextual_fallback(
                candidate_answer=candidate_answer,
                question_count=session.question_count,
            )


    def generate_next_question(
        self,
        *,
        session,
        candidate_answer: str,
    ) -> str:
        """
        Generate the next interview question using the LLM.

        The model receives:
        - Resume
        - Job Role
        - Conversation History
        - Questions Already Asked
        - Current Stage
        - Current Topic
        - Candidate's Latest Answer

        Returns:
            The next interview question.
        """

        job_context = get_job_context(session.job_role)
        interview_context = {
            "current_stage": session.current_stage,
            "current_topic": session.current_topic,
            "questions_asked": session.questions_asked,
            "candidate_answer": candidate_answer,
            "max_questions": session.max_questions,
            "question_count": session.question_count,
            "remaining_time_seconds": session.metrics.remaining_time,
            "time_mode": TimeManager.get_time_mode(session.metrics.remaining_time),
        }

        messages = build_prompt(
            interview_type=session.interview_type,
            job_context=job_context,
            resume=session.resume,
            conversation_history=[
                msg.model_dump()
                for msg in session.conversation
            ],
            interview_state=interview_context,
        )

        logger.info(
            "Generating next question for session %s",
            session.session_id,
        )

        response = chat_with_groq(
            messages=messages,
            temperature=0.3,
            json_output=True,
            max_tokens=220,
        )

        response_json = parse_llm_json_response(response)
        response = str(response_json.get("turn") or "")

        question = self._clean_generated_question(response)

        # Prevent empty responses
        if not question:
            raise ValueError("LLM returned an empty interview question.")

        # Prevent exact and closely paraphrased questions.
        if self._is_duplicate_question(question, session.questions_asked):

            logger.warning(
                "Duplicate question generated. Falling back."
            )

            question = self._build_contextual_fallback(
                candidate_answer=candidate_answer,
                question_count=session.question_count,
            )

        logger.info("Generated Question: %s", question)

        return question

    @staticmethod
    def _clean_generated_question(response: str) -> str:
        """Return a brief acknowledgement followed by exactly one question."""
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:markdown|text)?\s*", "", cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r"\s*```$", "", cleaned).strip()

        quoted_turns = re.findall(
            r'["\u201c]([^"\u201d]*\?)["\u201d]',
            cleaned,
            flags=re.DOTALL,
        )
        if quoted_turns:
            cleaned = quoted_turns[-1].strip()

        cleaned = " ".join(line.strip() for line in cleaned.splitlines() if line.strip())

        cleaned = re.sub(
            r"^(?:next\s+)?(?:interviewer\s+)?question\s*:\s*",
            "",
            cleaned,
            flags=re.IGNORECASE,
        ).strip().strip('"\'\u201c\u201d')

        # A valid interviewer turn must contain a complete question. Reject
        # truncated answers and echoed prompt instructions so they never reach TTS.
        if "?" not in cleaned:
            return ""

        prompt_leak_markers = (
            "you are sarah chen",
            "you are emily rodriguez",
            "you read the complete latest candidate answer",
            "you start with a brief",
            "you then ask exactly",
            "current interview state",
            "generate the next interviewer turn",
        )
        if any(marker in cleaned.lower() for marker in prompt_leak_markers):
            questions = re.findall(r"[^.!?]*\?", cleaned)
            return questions[-1].strip() if questions else ""

        sentences = [
            sentence.strip()
            for sentence in re.split(r"(?<=[.!?])\s+", cleaned)
            if sentence.strip()
        ]
        question_index = next(
            (index for index, sentence in enumerate(sentences) if "?" in sentence),
            None,
        )
        if question_index is None:
            return cleaned[: cleaned.find("?") + 1].strip()

        acknowledgements = [
            sentence
            for sentence in sentences[:question_index]
            if not re.match(
                r"^(?:based on|given|from) .*(?:i(?:'ll| will)|next question|follow-up)",
                sentence,
                flags=re.IGNORECASE,
            )
        ][-2:]
        question = sentences[question_index]
        question = question[: question.find("?") + 1].strip()
        return " ".join([*acknowledgements, question]).strip()

    @classmethod
    def _is_duplicate_question(cls, candidate: str, previous: list[str]) -> bool:
        """Detect exact or near-duplicate question wording, ignoring acknowledgements."""
        candidate_key = cls._normalized_question(candidate)
        if not candidate_key:
            return False
        return any(
            SequenceMatcher(None, candidate_key, cls._normalized_question(item)).ratio() >= 0.86
            for item in previous
        )

    @staticmethod
    def _normalized_question(turn: str) -> str:
        question_part = turn.rsplit(".", 1)[-1]
        if "?" in turn:
            sentences = re.findall(r"[^.!?]*\?", turn)
            if sentences:
                question_part = sentences[-1]
        return " ".join(re.findall(r"[a-z0-9]+", question_part.lower()))

    @staticmethod
    def _build_contextual_fallback(*, candidate_answer: str, question_count: int) -> str:
        """Keep a failed LLM turn connected to the answer without inventing details."""
        answer = " ".join(candidate_answer.split())
        acknowledgement = "Thanks for explaining that."
        prompts = (
            "What was your specific role in the experience you just described?",
            "What was the most important decision you made in that work, and why?",
            "What was the most difficult challenge you encountered there?",
            "What did you learn from that experience?",
        )
        if not answer:
            acknowledgement = "Thanks for your answer."
        return f"{acknowledgement} {prompts[max(question_count - 1, 0) % len(prompts)]}"


    def evaluate_answer(
        self,
        *,
        question: str,
        answer: str,
    ) -> AnswerEvaluation:
        """
        Evaluate the candidate's answer using the LLM.

        Args:
            question: The interview question that was asked.
            answer: Candidate's response.

        Returns:
            AnswerEvaluation object.
        """

        messages = build_answer_evaluation_prompt(
            question=question,
            answer=answer,
        )

        logger.info("Evaluating candidate answer...")

        try:
            raw_response = chat_with_groq(
                messages=messages,
                temperature=0,
                json_output=True,
                max_tokens=240,
            )

            response_json = parse_llm_json_response(raw_response)

            evaluation = AnswerEvaluation(**response_json)

            logger.info(
                "Answer evaluated successfully. "
                "Technical=%d Communication=%d Confidence=%d ProblemSolving=%d",
                evaluation.technical,
                evaluation.communication,
                evaluation.confidence,
                evaluation.problem_solving,
            )

            return evaluation

        except Exception as exc:
            logger.exception("Failed to evaluate candidate answer.")

            # Fallback evaluation so the interview can continue
            return AnswerEvaluation(
                quality="average",
                technical=5,
                communication=5,
                confidence=5,
                problem_solving=5,
                needs_followup=True,
                reason=f"Evaluation failed: {exc}",
            )

    def evaluate_pending_answers(self, session) -> None:
        """Evaluate stored answers once, immediately before report generation."""
        if session.question_evaluations or not session.pending_answers:
            return

        evaluations = self.evaluate_answers_batch(session.pending_answers)
        original_stage = session.current_stage
        original_difficulty = session.difficulty
        try:
            for pending, evaluation in zip(session.pending_answers, evaluations):
                session.current_stage = pending.stage
                session.difficulty = pending.difficulty
                InterviewScorer.update_scores(session.scores, evaluation)
                self._record_question_evaluation_safely(
                    session=session,
                    question=pending.question,
                    answer=pending.answer,
                    evaluation=evaluation,
                )
        finally:
            session.current_stage = original_stage
            session.difficulty = original_difficulty

    @staticmethod
    def evaluate_answers_batch(pending_answers: list[PendingAnswer]) -> list[AnswerEvaluation]:
        """Evaluate every transcript in a single structured LLM request."""
        payload = [
            {"question": item.question, "answer": item.answer}
            for item in pending_answers
        ]
        messages = [
            {
                "role": "system",
                "content": (
                    "You are an interview evaluator. Evaluate every Q&A item. Return only "
                    "JSON as {\"evaluations\":[...]}. Preserve input order and return exactly "
                    "one result per item. Each result requires quality (good/average/weak), "
                    "technical, communication, confidence, problem_solving (integers 0-10), "
                    "needs_followup (boolean), and reason (brief string)."
                ),
            },
            {"role": "user", "content": json.dumps(payload, separators=(",", ":"))},
        ]
        try:
            raw = chat_with_groq(
                messages=messages,
                temperature=0,
                json_output=True,
                max_tokens=min(1800, 120 + len(pending_answers) * 150),
            )
            parsed = parse_llm_json_response(raw)
            items = parsed.get("evaluations")
            if not isinstance(items, list) or len(items) != len(pending_answers):
                raise ValueError("Batch evaluation count did not match answer count.")
            return [AnswerEvaluation(**item) for item in items]
        except Exception as exc:
            logger.exception("Batch answer evaluation failed; using neutral fallback scores.")
            return [
                AnswerEvaluation(
                    quality="average",
                    technical=5,
                    communication=5,
                    confidence=5,
                    problem_solving=5,
                    needs_followup=False,
                    reason=f"Batch evaluation failed: {exc}",
                )
                for _ in pending_answers
            ]
        
    def generate_feedback(
        self,
        *,
        session_id: str,
    ) -> InterviewFeedback:
        """
        Generate the final interview feedback using the LLM.

        Args:
            session_id: Active interview session ID.

        Returns:
            InterviewFeedback object.
        """

        session = self.state.get_session(session_id)

        question_count = max(session.question_count, 1)

        average_scores = InterviewScorer.average_scores(
            session.scores,
            session.question_count,
        )

        overall = InterviewScorer.overall_score(
            average_scores
        )

        messages = build_feedback_prompt(
            resume=session.resume,
            job_role=session.job_role,
            conversation=self._conversation_to_messages(session),
            scores=average_scores,
        )

        logger.info(
            "Generating interview feedback for session %s",
            session.session_id,
        )

        try:

            raw_response = chat_with_groq(
                messages=messages,
                temperature=0,
                json_output=True,
            )

            feedback_json = parse_llm_json_response(raw_response)

            feedback = InterviewFeedback(**feedback_json)

            logger.info(
                "Interview feedback generated successfully."
            )

            return feedback

        except Exception as exc:

            logger.exception(
                "Failed to generate interview feedback."
            )

            overall_score = round(
                (
                    average_scores["technical"]
                    + average_scores["communication"]
                    + average_scores["confidence"]
                    + average_scores["problem_solving"]
                )
                / 4,
                2,
            )

            return InterviewFeedback(
                overall_score=overall_score,
                strengths=[
                    "Completed the interview."
                ],
                weaknesses=[
                    "Unable to generate AI feedback."
                ],
                communication=(
                    "Communication could not be evaluated."
                ),
                technical_knowledge=(
                    "Technical knowledge could not be evaluated."
                ),
                suggested_improvements=[
                    str(exc)
                ],
            )
        


    def _advance_stage(self, session) -> None:
        """
        Advance the interview to the next stage.

        Updates the session's current_stage and current_topic.
        If the interview is already at the final stage,
        nothing changes.
        """

        try:
            stages = get_stage_plan(session.interview_type)
            current_index = stages.index(session.current_stage)
        except ValueError:
            logger.warning(
                "Unknown interview stage '%s'. Resetting to first stage.",
                session.current_stage,
            )
            current_index = 0

        # Already at last stage
        if current_index >= len(stages) - 1:
            return

        next_stage = stages[current_index + 1]

        session.current_stage = next_stage
        session.current_topic = get_stage_topic(next_stage)

        logger.info(
            "Interview advanced to stage '%s'",
            session.current_stage,
        )

    @staticmethod
    def _update_difficulty(session, latest_score: float) -> None:
        """Adjust the live difficulty label from backend evaluation only."""
        if latest_score >= 80 and session.difficulty == "Easy":
            session.difficulty = "Medium"
        elif latest_score >= 85 and session.difficulty == "Medium":
            session.difficulty = "Hard"
        elif latest_score < 55 and session.difficulty == "Hard":
            session.difficulty = "Medium"
        elif latest_score < 45 and session.difficulty == "Medium":
            session.difficulty = "Easy"

    @staticmethod
    def _live_metrics(session) -> dict[str, object]:
        TimeManager.update_session_time(session)
        return {
            "remaining_time": session.metrics.remaining_time,
            "interview_progress": session.metrics.interview_progress,
            "difficulty": session.difficulty,
            "interview_status": "completed" if session.completed else "in_progress",
        }


    def _get_next_stage(self, current_stage: str) -> str:
        """
        Return the next interview stage.

        If already at the last stage,
        the same stage is returned.
        """

        try:
            stages = get_stage_plan("technical")
            index = stages.index(current_stage)
        except ValueError:
            return stages[0]

        if index >= len(stages) - 1:
            return current_stage

        return stages[index + 1]

    @staticmethod
    def _build_opening_question(
        *,
        candidate_name: str,
        interview_type: str,
    ) -> str:
        """Return a warm first question for the selected interview mode."""
        if interview_type == "hr":
            return (
                f"Hello {candidate_name}, welcome to the HR interview. "
                "Could you please introduce yourself and share what motivated you to apply for this role?"
            )

        return (
            f"Hello {candidate_name}, welcome to the technical interview. "
            "Could you please introduce yourself and briefly walk me through your relevant experience?"
        )




    def _conversation_to_messages(self, session) -> list[dict]:
            """
            Convert ConversationMessage objects to dictionaries
            for sending to Groq.
            """
            return [
                message.model_dump()
                for message in session.conversation
            ]
