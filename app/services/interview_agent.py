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

from app.services.interview_scorer import InterviewScorer
from app.services.interview_state import interview_state
from app.services.interview_prompts import (
    INTERVIEW_STAGES,
    build_answer_evaluation_prompt,
    build_feedback_prompt,
    build_next_question_prompt,
)
from app.services.ollama_service import (
    chat_with_ollama,
    parse_llm_json_response,
)
from app.models.interview_models import (
    AnswerEvaluation,
    InterviewFeedback,
)

from app.services.interview_prompts import (
    build_answer_evaluation_prompt,
    build_feedback_prompt,
)

from app.services.ollama_service import (
    chat_with_ollama,
    parse_llm_json_response,
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
        max_questions: int = 10,
    ) -> tuple[str, str]:
        """
        Start a new interview session.

        Creates a session, stores the candidate's resume,
        and generates the first interview question.

        Returns:
            tuple(session_id, first_question)
        """

        candidate_name = resume.get("name") or "Candidate"

        # Create interview session
        session = interview_state.create_session(
            candidate_name=candidate_name,
            job_role=job_role,
            resume=resume,
            max_questions=max_questions,
        )

        # First stage
        session.current_stage = "INTRODUCTION"
        session.current_topic = "Introduction"

        # First interview question
        first_question = (
            f"Hello {candidate_name}, welcome to the interview. "
            "Could you please introduce yourself?"
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

        # ---------------------------------------------------------
        # Save candidate answer
        # ---------------------------------------------------------
        self.state.add_candidate_message(
            session_id=session_id,
            message=answer,
        )

        # ---------------------------------------------------------
        # Evaluate answer
        # ---------------------------------------------------------
        evaluation = self.evaluate_answer(
            question=session.questions_asked[-1],
            answer=answer,
        )

        # ---------------------------------------------------------
        # Update running scores
        # ---------------------------------------------------------
        from app.services.interview_scorer import InterviewScorer

        InterviewScorer.update_scores(
            session.scores,
            evaluation,
        )

        # ---------------------------------------------------------
        # Check interview completion
        # ---------------------------------------------------------
        if self.state.reached_question_limit(session_id):
            self.state.mark_completed(session_id)

            closing_question = (
                "Thank you for your time. "
                "The interview has been completed."
            )

            self.state.add_assistant_message(
                session_id,
                closing_question,
            )

            return {
                "session_id": session.session_id,
                "question_number": session.question_count,
                "current_stage": session.current_stage,
                "current_topic": session.current_topic,
                "question": closing_question,
                "completed": True,
            }

        # ---------------------------------------------------------
        # Decide whether to ask a follow-up question
        # ---------------------------------------------------------
        if evaluation.needs_followup:

            next_question = self.generate_next_question(
                session=session,
                candidate_answer=answer,
            )

        else:

            self._advance_stage(session)

            next_question = self.generate_next_question(
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
        }


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

        messages = build_next_question_prompt(
            resume=session.resume,
            job_role=session.job_role,
            conversation=[
                msg.model_dump()
                for msg in session.conversation
            ],
            questions_asked=session.questions_asked,
            current_stage=session.current_stage,
            current_topic=session.current_topic,
            candidate_answer=candidate_answer,
        )

        logger.info(
            "Generating next question for session %s",
            session.session_id,
        )

        response = chat_with_ollama(
            messages=messages,
            temperature=0.4,
        )

        question = response.strip()

        # Defensive cleanup if the model accidentally returns markdown
        if question.startswith("```"):
            question = (
                question.replace("```", "")
                .replace("markdown", "")
                .replace("text", "")
                .strip()
            )

        # Remove surrounding quotes if present
        if question.startswith('"') and question.endswith('"'):
            question = question[1:-1].strip()

        # Prevent empty responses
        if not question:
            raise ValueError("LLM returned an empty interview question.")

        # Prevent duplicate questions
        if question in session.questions_asked:

            logger.warning(
                "Duplicate question generated. Falling back."
            )

            question = (
                "Can you elaborate more on your previous answer?"
            )

        logger.info("Generated Question: %s", question)

        return question


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
            raw_response = chat_with_ollama(
                messages=messages,
                temperature=0,
                json_output=True,
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

            raw_response = chat_with_ollama(
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
            current_index = INTERVIEW_STAGES.index(session.current_stage)
        except ValueError:
            logger.warning(
                "Unknown interview stage '%s'. Resetting to INTRODUCTION.",
                session.current_stage,
            )
            current_index = 0

        # Already at last stage
        if current_index >= len(INTERVIEW_STAGES) - 1:
            return

        next_stage = INTERVIEW_STAGES[current_index + 1]

        session.current_stage = next_stage

        stage_topics = {
            "INTRODUCTION": "Introduction",
            "RESUME": "Resume",
            "PROJECT": "Projects",
            "SKILLS": "Skills",
            "ROLE_SPECIFIC": "Role Specific",
            "BEHAVIORAL": "Behavioral",
            "CLOSING": "Closing",
        }

        session.current_topic = stage_topics.get(
            next_stage,
            next_stage.title(),
        )

        logger.info(
            "Interview advanced to stage '%s'",
            session.current_stage,
        )


    def _get_next_stage(self, current_stage: str) -> str:
        """
        Return the next interview stage.

        If already at the last stage,
        the same stage is returned.
        """

        try:
            index = INTERVIEW_STAGES.index(current_stage)
        except ValueError:
            return INTERVIEW_STAGES[0]

        if index >= len(INTERVIEW_STAGES) - 1:
            return current_stage

        return INTERVIEW_STAGES[index + 1]




    def _conversation_to_messages(self, session) -> list[dict]:
            """
            Convert ConversationMessage objects to dictionaries
            for sending to Ollama.
            """
            return [
                message.model_dump()
                for message in session.conversation
            ]
