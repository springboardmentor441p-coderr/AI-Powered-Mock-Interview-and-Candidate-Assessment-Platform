"""
Ports for thread-level evaluation and post-interview brief generation.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class ThreadEvaluationResult:
    """
    Result from evaluating one complete topic thread.

    All scores 0–10. Lists contain specific quotes/observations
    from the actual conversation — not generic feedback.
    """
    depth_under_pressure: float   # answers deepened or collapsed under probing
    conceptual_accuracy: float    # correct use of concepts in context, not buzzwords
    specificity: float            # concrete details vs vague claims
    recovery: float               # handled being wrong gracefully
    overall_score: float          # weighted: depth×0.35 + accuracy×0.35 + specificity×0.2 + recovery×0.1

    verdict: str                  # "strong" | "surface" | "bluffing" | "weak" | "insufficient"

    # Specific quotes from the conversation — this is more useful than scores
    red_flags: list[str] = field(default_factory=list)
    strong_signals: list[str] = field(default_factory=list)

    # Targeted questions for the next human round
    suggested_followups: list[str] = field(default_factory=list)

    requires_human_review: bool = False
    human_review_reason: str = ""

    turn_count: int = 0
    candidate_turn_count: int = 0

    model_used: str = ""
    raw_response: dict = field(default_factory=dict)


@dataclass
class InterviewBriefResult:
    """
    Post-interview brief aggregated from all thread evaluations.
    Written for a human recruiter, not for a scoring system.
    """
    overall_signal: str           # "strong" | "mixed" | "surface" | "inconsistent"
    summary: str                  # 2-3 paragraph narrative for the recruiter

    performs_under_pressure: bool
    specificity_consistent: bool
    self_contradictions_detected: bool
    contradiction_detail: str     # what was contradicted and where

    red_flags: list[str] = field(default_factory=list)
    strong_signals: list[str] = field(default_factory=list)

    # The most valuable output
    suggested_followup_questions: list[str] = field(default_factory=list)

    requires_human_review: bool = False

    model_used: str = ""
    raw_response: dict = field(default_factory=dict)


class IThreadEvaluationProvider(ABC):
    """Evaluate a complete topic thread (all turns on one seed topic)."""

    @abstractmethod
    def evaluate_thread(
        self,
        *,
        seed_topic_text: str,
        expected_topics: list[str],
        conversation: list[dict],   # [{"speaker": "assistant"|"candidate", "text": "..."}]
        interview_type: str,
        domain: str,
        difficulty: str,
    ) -> ThreadEvaluationResult:
        ...


class IInterviewBriefProvider(ABC):
    """Generate a post-interview brief from all thread evaluation results."""

    @abstractmethod
    def generate_brief(
        self,
        *,
        interview_type: str,
        domain: str,
        difficulty: str,
        thread_results: list[dict],   # serialized ThreadEvaluationResult per topic
    ) -> InterviewBriefResult:
        ...