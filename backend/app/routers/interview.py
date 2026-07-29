"""
FastAPI routes for the AI Interview Engine.
"""

from fastapi import APIRouter, HTTPException

from app.models.interview_models import (
    EndInterviewRequest,
    InterviewReport,
    StartInterviewRequest,
    StartInterviewResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
)
from app.services.interview_agent import InterviewAgent
from app.services.interview_state import InterviewSessionNotFound
from app.services.report_generator import ReportGenerator
from app.services.time_manager import TimeManager

router = APIRouter(
    prefix="/interview",
    tags=["Interview"],
)

agent = InterviewAgent()


# ==========================================================
# Start Interview
# ==========================================================

@router.post(
    "/start",
    response_model=StartInterviewResponse,
)
def start_interview(request: StartInterviewRequest):
    """
    Start a new interview.
    """

    try:

        session_id, question = agent.start_interview(
            resume=request.resume,
            job_role=request.job_role,
            interview_type=request.interview_type,
            max_questions=request.max_questions,
            interview_duration=request.interview_duration,
        )
        session = agent.state.get_session(session_id)
        TimeManager.update_session_time(session)

        return StartInterviewResponse(
            session_id=session_id,
            question=question,
            current_stage=session.current_stage,
            remaining_time=session.metrics.remaining_time,
            interview_progress=session.metrics.interview_progress,
            difficulty=session.difficulty,
            interview_status="in_progress",
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ==========================================================
# Submit Answer
# ==========================================================

@router.post(
    "/answer",
    response_model=SubmitAnswerResponse,
)
def submit_answer(request: SubmitAnswerRequest):
    """
    Submit a candidate answer.
    """

    try:

        response = agent.submit_answer(
            session_id=request.session_id,
            answer=request.answer,
        )

        return SubmitAnswerResponse(**response)

    except InterviewSessionNotFound as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ==========================================================
# End Interview
# ==========================================================

@router.post(
    "/end",
    response_model=InterviewReport,
)
def end_interview(request: EndInterviewRequest):
    """
    End interview and generate final feedback.
    """

    try:

        session = agent.state.get_session(request.session_id)
        agent.state.mark_completed(request.session_id)
        return ReportGenerator.generate_report(session)

    except InterviewSessionNotFound as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )
