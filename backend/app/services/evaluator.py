"""Evaluation contracts for a future AI assessment implementation."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Protocol


class EvaluationMetric(str, Enum):
    TECHNICAL_KNOWLEDGE = "technical_knowledge"
    COMMUNICATION = "communication"
    PROBLEM_SOLVING = "problem_solving"
    CONFIDENCE = "confidence"
    BEHAVIOR = "behavior"


@dataclass(frozen=True, slots=True)
class EvaluationRequest:
    question: str
    answer: str
    target_role: str | None = None
    expected_topics: list[str] = field(default_factory=list)


@dataclass(frozen=True, slots=True)
class EvaluationResult:
    status: str = "pending"
    metrics: dict[EvaluationMetric, float | None] = field(default_factory=dict)
    feedback: str | None = None
    suggested_better_answer: str | None = None


class Evaluator(Protocol):
    async def evaluate(self, request: EvaluationRequest) -> EvaluationResult: ...


class PendingEvaluator:
    """Safe placeholder that explicitly performs no scoring today."""

    async def evaluate(self, request: EvaluationRequest) -> EvaluationResult:
        return EvaluationResult(status="not_implemented")


def normalize_llm_evaluation(payload: dict) -> dict[str, int | str]:
    """Map a structured agent evaluation onto the existing persistence fields."""
    def score(name: str) -> int:
        try:
            return max(0, min(100, int(payload.get(name, 0))))
        except (TypeError, ValueError):
            return 0

    relevance = score("relevance")
    technical = score("technical_quality")
    communication = score("communication")
    completeness = score("completeness")
    confidence = score("confidence")
    return {
        "score": round((relevance + technical + communication + completeness + confidence) / 5),
        "relevance": relevance,
        "technical_correctness": technical,
        "completeness": completeness,
        "communication": communication,
        "confidence": confidence,
        "examples": completeness,
        "feedback": str(payload.get("feedback", ""))[:2000],
        "suggested_better_answer": "Use a concrete example, explain your decision, and describe the result.",
    }
