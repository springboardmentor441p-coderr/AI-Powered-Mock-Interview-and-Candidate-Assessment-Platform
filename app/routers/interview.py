"""
FastAPI routes for the AI Interview Engine.
"""

from fastapi import APIRouter, HTTPException

from app.models.interview_models import (
    EndInterviewRequest,
    InterviewFeedback,
    StartInterviewRequest,
    StartInterviewResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
)
from app.services.interview_agent import InterviewAgent
from app.services.interview_state import InterviewSessionNotFound

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
            max_questions=request.max_questions,
        )

        return StartInterviewResponse(
            session_id=session_id,
            question=question,
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
    response_model=InterviewFeedback,
)
def end_interview(request: EndInterviewRequest):
    """
    End interview and generate final feedback.
    """

    try:

        feedback = agent.generate_feedback(
            session_id=request.session_id,
        )

        return feedback

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