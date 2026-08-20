"""Stateful, unintegrated architecture for a future LLM interview agent."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
import re
from typing import Any

from .conversation_memory import ConversationMemory, InterviewStage
from .llm_service import LLMRequest, LLMService
from .prompt_builder import PromptBuilder
from .resume_analysis import generate_follow_up, questions_are_similar
from .resume_context import ResumeContext


@dataclass(slots=True)
class InterviewAgent:
    """Keeps future agent decisions separate from routers and LLM providers."""

    memory: ConversationMemory
    prompt_builder: PromptBuilder = field(default_factory=PromptBuilder)

    @property
    def is_complete(self) -> bool:
        return self.memory.interview_stage is InterviewStage.COMPLETE

    def prepare_next_question_request(self, resume_context: ResumeContext | None = None) -> LLMRequest:
        """Build, but do not send, the next-question request for a future adapter."""
        if self.is_complete:
            raise ValueError("The interview is already complete.")
        return LLMRequest(
            prompt=self.prompt_builder.build(self.memory, resume_context=resume_context),
            response_schema=INTERVIEW_DECISION_SCHEMA,
            metadata={
                "stage": self.memory.interview_stage.value,
                "question_number": self.memory.question_number + 1,
            },
        )

    async def decide_next_question(
        self,
        llm_service: LLMService,
        resume_context: ResumeContext | None = None,
    ) -> "InterviewDecision":
        """Ask the configured LLM for a validated, candidate-safe next turn."""
        response = await llm_service.generate(self.prepare_next_question_request(resume_context))
        decision = InterviewDecision.from_json(response.content)
        if self.memory.remaining_seconds is not None and self.memory.remaining_seconds <= 90 and decision.action != "closing":
            return self._closing_decision(decision.evaluation)
        if self._requires_grounded_transition(decision.question):
            # Resume/role data are coverage inputs, never candidate claims.
            return self._grounded_replacement(decision.evaluation, resume_context)
        if self.is_repetitive_question(decision.question):
            return self._distinct_replacement(decision.evaluation, resume_context)
        if decision.action == "follow_up" and self.memory.follow_up_depth >= 1:
            return self._coverage_transition(decision.evaluation)
        return decision

    def record_question(self, question: str) -> None:
        if self.is_complete:
            raise ValueError("Cannot add a question to a completed interview.")
        self.memory.record_question(question)

    def record_answer(self, answer: str) -> None:
        """Store a turn; stage and completion are decided by the live conversation."""
        self.memory.record_answer(answer)

    def safe_fallback_question(
        self,
        *,
        skills: list[str],
        role_title: str,
        difficulty: str,
        context: dict[str, Any],
    ) -> str:
        """Use the established local fallback without allowing it to invent a claim."""
        if self.memory.interview_stage in {InterviewStage.WARM_UP, InterviewStage.INTRODUCTION} and not self.memory.has_candidate_introduced_a_topic:
            return self._warm_up_transition({}).question
        latest = self.memory.conversation_history[-1] if self.memory.conversation_history else None
        return generate_follow_up(
            latest.question if latest else "",
            latest.answer if latest and latest.answer else "",
            skills,
            role_title,
            difficulty,
            context,
            history=[{"question": turn.question, "answer": turn.answer or ""} for turn in self.memory.conversation_history],
        )

    def _requires_grounded_transition(self, question: str) -> bool:
        """Reject LLM references that attribute background facts to the candidate."""
        if self.memory.interview_stage is InterviewStage.WARM_UP and not self.memory.has_candidate_introduced_a_topic:
            return True
        referenced = re.search(r"\byou\s+(?:mentioned|said|described)\s+(?:that\s+|the\s+|a\s+|an\s+)?([^?.!]+)", question, re.IGNORECASE)
        if referenced and not self.memory.candidate_history_mentions(referenced.group(1)):
            return True
        vague_reference = re.search(r"\bthat\s+(approach|project|technology|skill|api)\b", question, re.IGNORECASE)
        if vague_reference and not self.memory.candidate_history_mentions(vague_reference.group(0)):
            return True
        if self._contains_ungrounded_date(question):
            return True
        return self._copies_ungrounded_resume_phrase(question)

    def _contains_ungrounded_date(self, question: str) -> bool:
        date = re.search(
            r"\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}(?:\s*[-–]\s*(?:present|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}))?\b",
            question,
            re.IGNORECASE,
        )
        return bool(date and not self.memory.candidate_history_mentions(date.group(0)))

    def _copies_ungrounded_resume_phrase(self, question: str) -> bool:
        """Detect raw multi-word resume bullets copied into a candidate question."""
        resume = self.memory._normalise(self.memory.candidate_resume)
        candidate_history = self.memory._normalise(" ".join(self.memory.previous_answers))
        if not resume:
            return False
        words = re.findall(r"[a-z0-9+#.]+", question.lower())
        for width in range(6, 3, -1):
            for index in range(len(words) - width + 1):
                phrase = " ".join(words[index:index + width])
                if phrase in resume and phrase not in candidate_history:
                    return True
        return False

    def _grounded_replacement(
        self,
        evaluation: dict[str, Any],
        resume_context: ResumeContext | None,
    ) -> "InterviewDecision":
        if self.memory.interview_stage in {InterviewStage.WARM_UP, InterviewStage.INTRODUCTION} and not self.memory.has_candidate_introduced_a_topic:
            return self._warm_up_transition(evaluation)
        context = {
            "technologies": resume_context.technologies if resume_context else [],
            "projects": resume_context.projects if resume_context else [],
        }
        return InterviewDecision(
            action="next_question",
            stage=self.memory.interview_stage,
            question=self.safe_fallback_question(
                skills=self.memory.candidate_skills,
                role_title=self.memory.target_role or "your target role",
                difficulty="Intermediate",
                context=context,
            ),
            topic=self.memory.current_technical_topic or "",
            covered_topics=list(self.memory.topics_explored),
            next_topics=list(self.memory.topics_remaining),
            reason="The proposed question referenced background data not stated by the candidate.",
            evaluation=evaluation,
        )

    def is_repetitive_question(self, question: str) -> bool:
        return any(questions_are_similar(question, previous) for previous in self.memory.previous_questions)

    def _distinct_replacement(
        self,
        evaluation: dict[str, Any],
        resume_context: ResumeContext | None,
    ) -> "InterviewDecision":
        context = {"technologies": resume_context.technologies if resume_context else [], "projects": resume_context.projects if resume_context else []}
        return InterviewDecision(
            action="transition",
            stage=self.memory.interview_stage,
            question=self.safe_fallback_question(
                skills=self.memory.candidate_skills,
                role_title=self.memory.target_role or "your target role",
                difficulty="Intermediate",
                context=context,
            ),
            topic="",
            covered_topics=list(self.memory.topics_explored),
            next_topics=list(self.memory.topics_remaining),
            reason="The proposed question was a duplicate or near-duplicate.",
            evaluation=evaluation,
        )

    def _closing_decision(self, evaluation: dict[str, Any]) -> "InterviewDecision":
        return InterviewDecision(
            action="closing",
            stage=InterviewStage.CLOSING,
            question="Do you have any questions about the role or team?",
            topic="closing",
            covered_topics=list(self.memory.topics_explored),
            next_topics=[],
            reason="The interview is in its final 90 seconds.",
            evaluation=evaluation,
        )

    def _coverage_transition(self, evaluation: dict[str, Any]) -> "InterviewDecision":
        """Limit a main topic to one short follow-up before changing focus."""
        next_stage = {
            InterviewStage.WARM_UP: InterviewStage.INTRODUCTION,
            InterviewStage.INTRODUCTION: InterviewStage.EXPERIENCE,
            InterviewStage.EXPERIENCE: InterviewStage.PROJECTS,
            InterviewStage.PROJECTS: InterviewStage.TECHNICAL,
            InterviewStage.TECHNICAL: InterviewStage.BEHAVIORAL,
            InterviewStage.BEHAVIORAL: InterviewStage.CLOSING,
        }.get(self.memory.interview_stage, InterviewStage.CLOSING)
        questions = {
            InterviewStage.INTRODUCTION: "Could you briefly introduce yourself and tell me a little about your background?",
            InterviewStage.EXPERIENCE: "Could you tell me about an experience that has prepared you for this role?",
            InterviewStage.PROJECTS: "Could you walk me through a project that best demonstrates your contribution?",
            InterviewStage.TECHNICAL: "Could you describe a technical decision you made and the trade-offs you considered?",
            InterviewStage.BEHAVIORAL: "Could you share an example of how you worked with others to resolve a challenge?",
            InterviewStage.CLOSING: "Do you have any questions about the role or team?",
        }
        action = "closing" if next_stage is InterviewStage.CLOSING else "transition"
        return InterviewDecision(
            action=action,
            stage=next_stage,
            question=questions[next_stage],
            topic=next_stage.value,
            covered_topics=list(self.memory.topics_explored),
            next_topics=list(self.memory.topics_remaining),
            reason="The current main topic has already received a follow-up.",
            evaluation=evaluation,
        )

    @staticmethod
    def _warm_up_transition(evaluation: dict[str, Any]) -> "InterviewDecision":
        return InterviewDecision(
            action="next_question",
            stage=InterviewStage.INTRODUCTION,
            question="That's great to hear. Could you briefly introduce yourself and tell me a little about your background?",
            topic="",
            covered_topics=[],
            next_topics=["introduction", "motivation"],
            reason="No project or technical topic has been introduced by the candidate.",
            evaluation=evaluation,
        )


INTERVIEW_DECISION_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "action": {"type": "string", "enum": ["follow_up", "next_question", "transition", "closing"]},
        "stage": {"type": "string", "enum": [stage.value for stage in InterviewStage if stage is not InterviewStage.COMPLETE]},
        "question": {"type": "string"},
        "topic": {"type": "string"},
        "covered_topics": {"type": "array", "items": {"type": "string"}},
        "next_topics": {"type": "array", "items": {"type": "string"}},
        "reason": {"type": "string"},
        "evaluation": {
            "type": "object",
            "properties": {
                "relevance": {"type": "integer", "minimum": 0, "maximum": 100},
                "technical_quality": {"type": "integer", "minimum": 0, "maximum": 100},
                "communication": {"type": "integer", "minimum": 0, "maximum": 100},
                "completeness": {"type": "integer", "minimum": 0, "maximum": 100},
                "confidence": {"type": "integer", "minimum": 0, "maximum": 100},
                "feedback": {"type": "string"},
            },
            "required": ["relevance", "technical_quality", "communication", "completeness", "confidence", "feedback"],
        },
    },
    "required": ["action", "stage", "question", "topic", "covered_topics", "next_topics", "reason", "evaluation"],
}


@dataclass(frozen=True, slots=True)
class InterviewDecision:
    action: str
    stage: InterviewStage
    question: str
    topic: str
    covered_topics: list[str]
    next_topics: list[str]
    reason: str
    evaluation: dict[str, Any]

    @classmethod
    def from_json(cls, content: str) -> "InterviewDecision":
        try:
            data = json.loads(content)
            action = str(data["action"])
            stage = InterviewStage(str(data["stage"]))
            question = str(data["question"]).strip()
            topic = str(data["topic"]).strip()
            covered_topics = [str(item) for item in data["covered_topics"]]
            next_topics = [str(item) for item in data["next_topics"]]
            evaluation = data["evaluation"]
        except (TypeError, KeyError, ValueError, json.JSONDecodeError) as exc:
            raise ValueError("LLM returned an invalid interview decision.") from exc
        if action not in {"follow_up", "next_question", "transition", "closing"} or not question:
            raise ValueError("LLM decision did not include a usable interviewer question.")
        if not isinstance(evaluation, dict):
            raise ValueError("LLM decision evaluation must be an object.")
        return cls(action=action, stage=stage, question=question, topic=topic, covered_topics=covered_topics, next_topics=next_topics, reason=str(data.get("reason", "")), evaluation=evaluation)
