"""Provider-independent interview conversation state."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from enum import Enum
import re
from typing import Any


class InterviewStage(str, Enum):
    WARM_UP = "warm_up"
    INTRODUCTION = "introduction"
    EXPERIENCE = "experience"
    PROJECTS = "projects"
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    CLOSING = "closing"
    COMPLETE = "complete"


@dataclass(slots=True)
class ConversationTurn:
    question: str
    answer: str | None = None
    question_number: int = 0
    score: float | None = None
    feedback: str | None = None


@dataclass(slots=True)
class ConversationMemory:
    """All context needed to continue an interview, with no LLM dependency."""

    candidate_resume: str = ""
    job_description: str = ""
    candidate_skills: list[str] = field(default_factory=list)
    company_name: str | None = None
    target_role: str | None = None
    interview_type: str = "general"
    interview_stage: InterviewStage = InterviewStage.WARM_UP
    question_number: int = 0
    previous_scores: list[float] = field(default_factory=list)
    previous_feedback: list[str] = field(default_factory=list)
    current_technical_topic: str | None = None
    remaining_seconds: int | None = None
    topics_explored: list[str] = field(default_factory=list)
    topics_remaining: list[str] = field(default_factory=list)
    candidate_claims: list[str] = field(default_factory=list)
    demonstrated_skills: list[str] = field(default_factory=list)
    follow_up_depth: int = 0
    conversation_history: list[ConversationTurn] = field(default_factory=list)

    def record_question(self, question: str) -> ConversationTurn:
        self.question_number += 1
        turn = ConversationTurn(question=question, question_number=self.question_number)
        self.conversation_history.append(turn)
        return turn

    def record_answer(
        self,
        answer: str,
        *,
        score: float | None = None,
        feedback: str | None = None,
    ) -> ConversationTurn:
        if not self.conversation_history:
            raise ValueError("Cannot record an answer before recording a question.")
        turn = self.conversation_history[-1]
        turn.answer = answer
        turn.score = score
        turn.feedback = feedback
        if score is not None:
            self.previous_scores.append(score)
        if feedback:
            self.previous_feedback.append(feedback)
        return turn

    @property
    def previous_questions(self) -> list[str]:
        return [turn.question for turn in self.conversation_history]

    @property
    def previous_answers(self) -> list[str]:
        return [turn.answer for turn in self.conversation_history if turn.answer]

    @property
    def has_candidate_introduced_a_topic(self) -> bool:
        """A warm-up reply alone must not be treated as a project/technical topic."""
        topic_words = {
            "project", "built", "developed", "implemented", "designed", "created",
            "react", "javascript", "typescript", "python", "java", "api", "rest",
            "database", "sql", "frontend", "backend", "component", "performance",
            "authentication", "testing", "docker", "aws", "application", "system",
        }
        words = {word.strip(".,!?;:").lower() for answer in self.previous_answers for word in answer.split()}
        return bool(words & topic_words)

    def candidate_history_mentions(self, detail: str) -> bool:
        """Return whether a detail is grounded in a candidate answer, not background data."""
        normalised_detail = self._normalise(detail)
        if not normalised_detail:
            return False
        return normalised_detail in self._normalise(" ".join(self.previous_answers))

    @staticmethod
    def _normalise(value: str) -> str:
        return " ".join(re.findall(r"[a-z0-9+#.]+", (value or "").lower()))

    def as_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["interview_stage"] = self.interview_stage.value
        return data
