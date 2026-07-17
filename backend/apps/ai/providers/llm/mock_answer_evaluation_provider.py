"""
Mock providers for thread evaluation and brief generation.
Returns deterministic results so tests and local dev never hit Gemini.
"""
from apps.ai.providers.llm.answer_evaluation_interfaces import (
    InterviewBriefResult,
    IInterviewBriefProvider,
    IThreadEvaluationProvider,
    ThreadEvaluationResult,
)


class MockThreadEvaluationProvider(IThreadEvaluationProvider):
    def evaluate_thread(
        self,
        *,
        seed_topic_text: str,
        expected_topics: list[str],
        conversation: list[dict],
        interview_type: str,
        domain: str,
        difficulty: str,
    ) -> ThreadEvaluationResult:
        candidate_turns = [t for t in conversation if t["speaker"] == "candidate"]
        return ThreadEvaluationResult(
            depth_under_pressure=7.0,
            conceptual_accuracy=7.0,
            specificity=6.5,
            recovery=7.0,
            overall_score=6.9,
            verdict="surface",
            red_flags=["Mock: no real evaluation performed"],
            strong_signals=["Mock: candidate produced sufficient turns"],
            suggested_followups=["Mock: probe this topic deeper in the next round"],
            requires_human_review=False,
            turn_count=len(conversation),
            candidate_turn_count=len(candidate_turns),
            model_used="mock",
        )


class MockInterviewBriefProvider(IInterviewBriefProvider):
    def generate_brief(
        self,
        *,
        interview_type: str,
        domain: str,
        difficulty: str,
        thread_results: list[dict],
    ) -> InterviewBriefResult:
        return InterviewBriefResult(
            overall_signal="mixed",
            summary=(
                "This is a mock interview brief. In production this would be a "
                "structured narrative written by Gemini after reviewing all topic "
                "thread evaluations. It would describe the candidate's strengths, "
                "gaps, and the single most important thing to probe in the next round."
            ),
            performs_under_pressure=True,
            specificity_consistent=False,
            self_contradictions_detected=False,
            contradiction_detail="",
            red_flags=["Mock: no real evaluation performed"],
            strong_signals=["Mock: interview completed successfully"],
            suggested_followup_questions=[
                "Mock question 1: probe technical depth",
                "Mock question 2: verify specific claims",
                "Mock question 3: test problem-solving under pressure",
            ],
            requires_human_review=False,
            model_used="mock",
        )