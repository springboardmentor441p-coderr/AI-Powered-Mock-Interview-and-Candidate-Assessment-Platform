"""
Adaptive Question Planner.

Translates high-level strategy engine decisions, time constraints, and stage context
into actionable question generation instructions for the prompt builder and interview agent.
"""

import logging
from typing import Any

from app.models.interview_models import InterviewSession
from app.services.strategy_engine import InterviewStrategyEngine, StrategyDecision
from app.services.time_manager import TimeManager

logger = logging.getLogger(__name__)


class AdaptiveQuestionPlanner:
    """
    Formulates precise question planning specifications to guide LLM prompt creation.
    """

    @classmethod
    def plan_question(
        cls,
        session: InterviewSession,
        strategy: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Build a question plan context dictionary.

        Args:
            session: Active interview session.
            strategy: Strategy engine output dict (decision, target_stage, target_difficulty, reason).

        Returns:
            Question plan dict containing stage, topic, difficulty, style, and instructions.
        """
        decision = strategy.get("decision", StrategyDecision.CONTINUE_TOPIC)
        target_stage = strategy.get("target_stage", session.current_stage)
        target_difficulty = strategy.get("target_difficulty", session.difficulty)
        topic = InterviewStrategyEngine.get_stage_topic(target_stage)

        remaining_seconds = session.metrics.remaining_time
        time_mode = TimeManager.get_time_mode(remaining_seconds)

        # Style and instruction mapping based on strategy & time mode
        if decision == StrategyDecision.START_WRAPUP or target_stage == "CLOSING":
            style = "closing_wrapup"
            instruction = (
                "The interview is concluding. Ask one thoughtful, concise closing question "
                "or invite the candidate to share final questions or concluding thoughts."
            )

        elif decision == StrategyDecision.FOLLOW_UP:
            style = "detailed_followup"
            instruction = (
                "Ask a targeted follow-up question digging deeper into the candidate's "
                "previous answer to clarify technical specifics or missing details."
            )

        elif decision == StrategyDecision.INCREASE_DIFFICULTY:
            style = "advanced_scenario"
            instruction = (
                f"The candidate is performing exceptionally well. Formulate a challenging, "
                f"complex {target_difficulty}-level question testing edge cases, system trade-offs, "
                f"or deep architectural reasoning."
            )

        elif decision == StrategyDecision.REDUCE_DIFFICULTY:
            style = "fundamental_concept"
            instruction = (
                f"Formulate a clear, accessible {target_difficulty}-level question focusing "
                f"on core concepts and fundamental understanding to help the candidate demonstrate baseline knowledge."
            )

        else:
            style = "standard_topic"
            instruction = (
                f"Ask a realistic, role-relevant question aligned with the '{topic}' stage "
                f"at a {target_difficulty} difficulty level."
            )

        # Time-aware constraints
        time_guidance = ""
        if time_mode == "DETAILED":
            time_guidance = "Sufficient time available (>8 mins). Feel free to ask comprehensive questions."
        elif time_mode == "CONCISE":
            time_guidance = "Moderate time remaining (3-8 mins). Keep the question direct and concise."
        else:
            time_guidance = "Limited time remaining (<2 mins). Keep question brief and focused."

        return {
            "stage": target_stage,
            "topic": topic,
            "difficulty": target_difficulty,
            "style": style,
            "instruction": instruction,
            "time_guidance": time_guidance,
            "time_mode": time_mode,
            "decision": decision.value if isinstance(decision, StrategyDecision) else str(decision),
            "reason": strategy.get("reason", ""),
        }
