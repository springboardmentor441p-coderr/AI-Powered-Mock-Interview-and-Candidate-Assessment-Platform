import json
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.interview import InterviewSession, InterviewQuestion, Report
from app.services.interview_service import InterviewService
from app.schemas.interview import (
    StartInterviewRequest,
    StartInterviewResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
    InterviewControlRequest,
    InterviewQuestionResponse,
    InterviewHistoryListItem,
    EvaluationMetricDetail
)
from app.schemas.report import ReportResponse

router = APIRouter(prefix="/interview", tags=["Interview"])


def _require_current_user(request: Request) -> int:
    user = getattr(request.state, "current_user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )
    return user.id


@router.post("/start", response_model=StartInterviewResponse, status_code=status.HTTP_201_CREATED)
async def start_interview(
    payload: StartInterviewRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> StartInterviewResponse:
    user_id = _require_current_user(request)
    service = InterviewService(db)
    try:
        session = await service.start_session(
            candidate_id=user_id,
            job_role=payload.job_role,
            difficulty=payload.difficulty,
            interview_type=payload.interview_type
        )
        
        # Fetch first question from DB
        first_q = session.questions[0]
        return StartInterviewResponse(
            session_id=session.id,
            current_round=session.current_round,
            question_id=first_q.id,
            question_text=first_q.question_text
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/submit-answer", response_model=SubmitAnswerResponse)
async def submit_answer(
    payload: SubmitAnswerRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> SubmitAnswerResponse:
    user_id = _require_current_user(request)
    # Verify session belongs to user
    session = db.get(InterviewSession, payload.session_id)
    if not session or session.candidate_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found or unauthorized.")

    service = InterviewService(db)
    try:
        result = await service.submit_and_evaluate(
            session_id=payload.session_id,
            question_id=payload.question_id,
            answer_text=payload.answer_text
        )
        
        eval_obj = result["evaluation"]
        eval_detail = EvaluationMetricDetail(
            score=eval_obj.score,
            technical_accuracy=eval_obj.technical_accuracy,
            concept_understanding=eval_obj.concept_understanding,
            communication=eval_obj.communication,
            problem_solving=eval_obj.problem_solving,
            confidence=eval_obj.confidence,
            completeness=eval_obj.completeness,
            practical_knowledge=eval_obj.practical_knowledge,
            strengths=eval_obj.strengths,
            weaknesses=eval_obj.weaknesses
        )

        return SubmitAnswerResponse(
            session_id=result["session_id"],
            question_id=result["question_id"],
            evaluation=eval_detail,
            next_action=result["next_action"],
            next_question=result["next_question"],
            next_question_id=result["next_question_id"]
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/control")
def control_interview(
    payload: InterviewControlRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    user_id = _require_current_user(request)
    session = db.get(InterviewSession, payload.session_id)
    if not session or session.candidate_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    action = payload.action.lower()
    if action == "pause":
        session.status = "PAUSED"
    elif action == "resume":
        session.status = "IN_PROGRESS"
    elif action == "stop" or action == "end":
        session.status = "TERMINATED"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported action: {payload.action}")

    db.commit()
    return {"status": "ok", "session_status": session.status}


@router.get("/history", response_model=List[InterviewHistoryListItem])
def list_interview_history(
    request: Request,
    db: Session = Depends(get_db)
) -> List[InterviewHistoryListItem]:
    user_id = _require_current_user(request)
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.candidate_id == user_id)
        .order_by(InterviewSession.created_at.desc())
        .all()
    )
    return [InterviewHistoryListItem.model_validate(s) for s in sessions]


@router.get("/report/{session_id}", response_model=ReportResponse)
def get_interview_report(
    session_id: int,
    request: Request,
    db: Session = Depends(get_db)
) -> ReportResponse:
    user_id = _require_current_user(request)
    report = db.query(Report).filter(Report.session_id == session_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not generated yet for this session.")

    session = report.session
    if session.candidate_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access to report.")

    candidate = session.candidate

    try:
        strengths_list = json.loads(report.strengths) if report.strengths else []
    except Exception:
        strengths_list = []

    try:
        weaknesses_list = json.loads(report.weaknesses) if report.weaknesses else []
    except Exception:
        weaknesses_list = []

    try:
        learning_path_list = json.loads(report.learning_path) if report.learning_path else []
    except Exception:
        learning_path_list = []

    return ReportResponse(
        id=report.id,
        session_id=report.session_id,
        overall_score=report.overall_score,
        round1_score=report.round1_score,
        round2_score=report.round2_score,
        strengths=strengths_list,
        weaknesses=weaknesses_list,
        learning_path=learning_path_list,
        hiring_recommendation=report.hiring_recommendation,
        summary_notes=report.summary_notes,
        created_at=report.created_at,
        candidate_name=candidate.username if candidate else "Candidate",
        candidate_email=candidate.email if candidate else "",
        job_role=session.job_role,
        difficulty=session.difficulty
    )
