"""
In-memory interview session manager.

This module is responsible for:
- Creating interview sessions
- Retrieving interview sessions
- Updating interview sessions
- Deleting interview sessions

Currently, sessions are stored in memory.

Later this can be replaced with Redis, MongoDB, PostgreSQL, etc.
"""


from __future__ import annotations

import uuid

from app.models.interview_models import (
    InterviewSession,
    ConversationMessage,
)



class InterviewSessionNotFound(Exception):
    """Raised when an interview session cannot be found."""


class InterviewStateManager:
    """
    Manages all interview sessions.
    """

    def __init__(self) -> None:
        self._sessions: dict[str, InterviewSession] = {}

    # ---------------------------------------------------------
    # Session CRUD
    # ---------------------------------------------------------

    def create_session(
        self,
        *,
        candidate_name: str,
        job_role: str,
        interview_type: str = "technical",
        resume: dict,
        max_questions: int = 10,
        interview_duration: int = 15,
    ) -> InterviewSession:
        """
        Create a new interview session.
        """

        session = InterviewSession(
            session_id=str(uuid.uuid4()),
            candidate_name=candidate_name,
            job_role=job_role,
            interview_type=interview_type,
            resume=resume,
            max_questions=max_questions,
            interview_duration=interview_duration,
        )
        session.metrics.remaining_time = interview_duration * 60

        self._sessions[session.session_id] = session

        return session

    def get_session(self, session_id: str) -> InterviewSession:
        """
        Retrieve an interview session.
        """

        session = self._sessions.get(session_id)

        if session is None:
            raise InterviewSessionNotFound(
                f"Session '{session_id}' does not exist."
            )

        return session

    def delete_session(self, session_id: str) -> None:
        """
        Delete an interview session.
        """

        if session_id in self._sessions:
            del self._sessions[session_id]

    def session_exists(self, session_id: str) -> bool:
        """
        Check whether a session exists.
        """

        return session_id in self._sessions

    # ---------------------------------------------------------
    # Conversation
    # ---------------------------------------------------------

    def add_assistant_message(
        self,
        session_id: str,
        message: str,
    ) -> None:
        """
        Save interviewer message.
        """

        session = self.get_session(session_id)

        session.conversation.append(
            ConversationMessage(
                role="assistant",
                content=message,
            )
        )

    def add_candidate_message(
        self,
        session_id: str,
        message: str,
    ) -> None:
        """
        Save candidate message.
        """

        session = self.get_session(session_id)

        session.conversation.append(
            ConversationMessage(
                role="user",
                content=message,
            )
        )

    # ---------------------------------------------------------
    # Questions
    # ---------------------------------------------------------

    def add_question(
        self,
        session_id: str,
        question: str,
    ) -> None:
        """
        Record a question that has already been asked.
        """

        session = self.get_session(session_id)

        session.questions_asked.append(question)
        session.question_count += 1

    # ---------------------------------------------------------
    # Stage
    # ---------------------------------------------------------

    def set_stage(
        self,
        session_id: str,
        stage: str,
    ) -> None:
        """
        Update interview stage.
        """

        session = self.get_session(session_id)

        session.current_stage = stage

    def set_topic(
        self,
        session_id: str,
        topic: str,
    ) -> None:
        """
        Update current interview topic.
        """

        session = self.get_session(session_id)

        session.current_topic = topic

    # ---------------------------------------------------------
    # Scores
    # ---------------------------------------------------------

    def update_scores(
        self,
        session_id: str,
        *,
        technical: float,
        communication: float,
        confidence: float,
        problem_solving: float,
    ) -> None:
        """
        Increment running interview scores.
        """

        session = self.get_session(session_id)

        session.scores.technical += technical
        session.scores.communication += communication
        session.scores.confidence += confidence
        session.scores.problem_solving += problem_solving

    # ---------------------------------------------------------
    # Completion
    # ---------------------------------------------------------

    def mark_completed(
        self,
        session_id: str,
    ) -> None:
        """
        Mark interview as completed.
        """

        session = self.get_session(session_id)

        session.completed = True

    def is_completed(
        self,
        session_id: str,
    ) -> bool:
        """
        Check if interview has completed.
        """

        session = self.get_session(session_id)

        return session.completed

    def reached_question_limit(
        self,
        session_id: str,
    ) -> bool:
        """
        Check if maximum number of questions has been reached.
        """

        session = self.get_session(session_id)

        return session.question_count >= session.max_questions

    # ---------------------------------------------------------
    # Utility
    # ---------------------------------------------------------

    def get_all_sessions(self) -> dict[str, InterviewSession]:
        """
        Return all active sessions.
        """

        return self._sessions

    def clear(self) -> None:
        """
        Remove every session.

        Useful during testing.
        """

        self._sessions.clear()


# ------------------------------------------------------------------
# Singleton instance used throughout the application
# ------------------------------------------------------------------

interview_state = InterviewStateManager()
