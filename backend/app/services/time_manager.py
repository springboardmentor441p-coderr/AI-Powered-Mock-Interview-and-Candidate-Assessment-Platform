"""
Time Manager service for the Time-Aware Adaptive AI Interview Engine.

Responsible for:
- Maintaining session start time, duration, elapsed time, and remaining time.
- Calculating average answer time across questions.
- Determining time mode (Detailed, Concise, Wrap-Up).
- Serving as the backend source of truth for interview timing.
"""

from datetime import datetime, timezone
import logging
from typing import Literal

from app.models.interview_models import InterviewSession

logger = logging.getLogger(__name__)

TimeMode = Literal["DETAILED", "CONCISE", "WRAP_UP"]


class TimeManager:
    """
    Dedicated Time Manager for tracking and calculating interview session timing.
    """

    # Time thresholds in seconds
    DETAILED_THRESHOLD_SECONDS: float = 480.0  # 8 minutes
    WRAP_UP_THRESHOLD_SECONDS: float = 120.0   # 2 minutes

    @classmethod
    def calculate_timing(cls, session: InterviewSession) -> dict[str, float]:
        """
        Calculate current elapsed time, remaining time, and progress percentage.
        """
        now = datetime.now(timezone.utc)
        start_time = session.interview_start_time
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)

        elapsed_seconds = max(0.0, (now - start_time).total_seconds())
        total_duration_seconds = max(1.0, float(session.interview_duration * 60))
        remaining_seconds = max(0.0, total_duration_seconds - elapsed_seconds)

        # Progress calculation combines time elapsed and questions answered
        time_progress = min(100.0, (elapsed_seconds / total_duration_seconds) * 100.0)
        question_progress = min(
            100.0,
            (session.question_count / max(1, session.max_questions)) * 100.0,
        )
        # Weighted overall progress (60% question progress, 40% time progress)
        overall_progress = round(
            min(100.0, 0.6 * question_progress + 0.4 * time_progress), 1
        )

        return {
            "elapsed_seconds": elapsed_seconds,
            "remaining_seconds": remaining_seconds,
            "total_duration_seconds": total_duration_seconds,
            "progress_percentage": overall_progress,
        }

    @classmethod
    def update_session_time(
        cls,
        session: InterviewSession,
        last_response_time_seconds: float | None = None,
    ) -> InterviewSession:
        """
        Update the session's time properties and live metrics.
        """
        timing = cls.calculate_timing(session)
        remaining_int = int(timing["remaining_seconds"])

        session.metrics.remaining_time = remaining_int
        session.metrics.interview_progress = timing["progress_percentage"]

        if last_response_time_seconds is not None and last_response_time_seconds > 0:
            current_eval_count = len(session.question_evaluations)
            if current_eval_count > 0:
                total_time = (
                    session.average_answer_time * (current_eval_count - 1)
                    + last_response_time_seconds
                )
                session.average_answer_time = round(total_time / current_eval_count, 2)
            else:
                session.average_answer_time = round(last_response_time_seconds, 2)
            session.metrics.average_response_time = session.average_answer_time

        return session

    @classmethod
    def get_time_mode(cls, remaining_seconds: float) -> TimeMode:
        """
        Return the time mode based on remaining seconds.
        - > 8 mins (480s): DETAILED
        - 3 - 8 mins (180s - 480s): CONCISE
        - < 2 mins (120s): WRAP_UP
        """
        if remaining_seconds > cls.DETAILED_THRESHOLD_SECONDS:
            return "DETAILED"
        if remaining_seconds < cls.WRAP_UP_THRESHOLD_SECONDS:
            return "WRAP_UP"
        return "CONCISE"

    @classmethod
    def is_time_expired(cls, session: InterviewSession) -> bool:
        """
        Check if the session duration has expired.
        """
        timing = cls.calculate_timing(session)
        return timing["remaining_seconds"] <= 0.0
