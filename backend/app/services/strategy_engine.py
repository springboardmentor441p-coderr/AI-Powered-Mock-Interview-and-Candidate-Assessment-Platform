"""
Adaptive Interview Strategy Engine.

Responsible for deciding the next high-level action for the interviewer:
- Continue current topic
- Ask follow-up question
- Increase difficulty
- Reduce difficulty
- Move to next stage
- Skip remaining questions
- Start wrap-up
- End interview
"""

from enum import Enum
import logging
from typing import Any, Literal

from app.models.interview_models import InterviewSession
from app.services.time_manager import TimeManager

logger = logging.getLogger(__name__)


class StrategyDecision(str, Enum):
    CONTINUE_TOPIC = "continue_topic"
    FOLLOW_UP = "follow_up"
    INCREASE_DIFFICULTY = "increase_difficulty"
    REDUCE_DIFFICULTY = "reduce_difficulty"
    MOVE_NEXT_STAGE = "move_next_stage"
    SKIP_REMAINING = "skip_remaining"
    START_WRAPUP = "start_wrapup"
    END_INTERVIEW = "end_interview"


# Standard stages supported by the strategy engine
STAGE_SEQUENCE: dict[str, list[str]] = {
    "technical": [
        "WARM_UP",
        "EXPERIENCE",
        "TECHNICAL",
        "BEHAVIORAL",
        "CLOSING",
    ],
    "hr": [
        "WARM_UP",
        "EXPERIENCE",
        "HR_CORE",
        "BEHAVIORAL",
        "CLOSING",
    ],
}

STAGE_TOPICS: dict[str, str] = {
    "WARM_UP": "Warm-Up & Introduction",
    "EXPERIENCE": "Work Experience & Background",
    "TECHNICAL": "Technical Deep Dive & System Design",
    "HR_CORE": "Communication & Cultural Alignment",
    "BEHAVIORAL": "Behavioral & Conflict Resolution",
    "CLOSING": "Interview Wrap-Up & Closing Questions",
}


class InterviewStrategyEngine:
    """
    Decides what strategy the Interview Agent should execute next.
    """

    @classmethod
    def get_stages(cls, interview_type: str = "technical") -> list[str]:
        """Return the stage plan for the interview type."""
        normalized = (interview_type or "technical").lower()
        return STAGE_SEQUENCE.get(normalized, STAGE_SEQUENCE["technical"])

    @classmethod
    def get_stage_topic(cls, stage: str) -> str:
        """Return human-readable topic name for a stage code."""
        return STAGE_TOPICS.get(stage, stage.replace("_", " ").title())

    @classmethod
    def evaluate_next_action(cls, session: InterviewSession) -> dict[str, Any]:
        """
        Evaluate time, performance, current stage, and history to decide next action.

        Returns:
            dict containing:
            - "decision": StrategyDecision
            - "target_stage": str
            - "target_difficulty": str ("Easy", "Medium", "Hard")
            - "reason": str
        """
        timing = TimeManager.calculate_timing(session)
        remaining_seconds = timing["remaining_seconds"]
        time_mode = TimeManager.get_time_mode(remaining_seconds)

        stages = cls.get_stages(session.interview_type)
        current_stage = session.current_stage
        if current_stage not in stages:
            current_stage = stages[0]

        current_stage_idx = stages.index(current_stage)

        # Check hard completion limits
        if session.question_count >= session.max_questions or remaining_seconds <= 0:
            return {
                "decision": StrategyDecision.END_INTERVIEW,
                "target_stage": "CLOSING",
                "target_difficulty": session.difficulty,
                "reason": "Reached question limit or duration expired.",
            }

        # Time-Aware Behavior: < 2 minutes remaining -> Start Wrap-up
        if time_mode == "WRAP_UP" or remaining_seconds < 120.0:
            if current_stage != "CLOSING":
                return {
                    "decision": StrategyDecision.START_WRAPUP,
                    "target_stage": "CLOSING",
                    "target_difficulty": session.difficulty,
                    "reason": "Less than 2 minutes remaining. Moving directly to closing.",
                }

        # Evaluate candidate performance from recent evaluations
        recent_eval = session.question_evaluations[-1] if session.question_evaluations else None
        avg_score = 70.0
        needs_followup = False

        if recent_eval:
            avg_score = recent_eval.overall_score
            needs_followup = recent_eval.needs_followup

        # Determine difficulty adjustment
        target_difficulty = session.difficulty
        difficulty_decision = None

        if avg_score >= 80.0 and session.difficulty != "Hard":
            if session.difficulty == "Easy":
                target_difficulty = "Medium"
            elif session.difficulty == "Medium":
                target_difficulty = "Hard"
            difficulty_decision = StrategyDecision.INCREASE_DIFFICULTY

        elif avg_score < 55.0 and session.difficulty != "Easy":
            if session.difficulty == "Hard":
                target_difficulty = "Medium"
            elif session.difficulty == "Medium":
                target_difficulty = "Easy"
            difficulty_decision = StrategyDecision.REDUCE_DIFFICULTY

        # Check follow-up capability (only allowed if time > 8 mins or detailed mode)
        if needs_followup and time_mode == "DETAILED" and remaining_seconds > 480.0:
            return {
                "decision": StrategyDecision.FOLLOW_UP,
                "target_stage": current_stage,
                "target_difficulty": target_difficulty,
                "reason": "Candidate's response required clarification and sufficient time remains for follow-up.",
            }

        # Check if we should advance to the next stage
        # Stage advancement rules: advance after 1-2 questions per stage if progress is healthy
        questions_in_current_stage = sum(
            1 for eval_item in session.question_evaluations if eval_item.stage == current_stage
        )

        # In Concise mode (3-8 min remaining), shorten stage duration
        stage_question_cap = 1 if time_mode in ("CONCISE", "WRAP_UP") else 2

        if questions_in_current_stage >= stage_question_cap and current_stage_idx < len(stages) - 1:
            next_stage = stages[current_stage_idx + 1]
            return {
                "decision": StrategyDecision.MOVE_NEXT_STAGE,
                "target_stage": next_stage,
                "target_difficulty": target_difficulty,
                "reason": f"Completed questions for stage '{current_stage}'. Moving to '{next_stage}'.",
            }

        # Default: Difficulty adjustment or continue current topic
        if difficulty_decision:
            return {
                "decision": difficulty_decision,
                "target_stage": current_stage,
                "target_difficulty": target_difficulty,
                "reason": f"Adjusting difficulty to '{target_difficulty}' based on candidate performance score ({avg_score:.1f}).",
            }

        return {
            "decision": StrategyDecision.CONTINUE_TOPIC,
            "target_stage": current_stage,
            "target_difficulty": target_difficulty,
            "reason": "Continuing current stage topic with standard question progression.",
        }
