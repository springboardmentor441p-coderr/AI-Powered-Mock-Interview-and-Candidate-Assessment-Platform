from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database.session import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.candidate_profile import CandidateProfile
from app.models.interview import InterviewSession, Evaluation, Report
from app.models.coding import CodingSubmission

router = APIRouter(prefix="/admin", tags=["Admin/Recruiter Services"])


def _require_admin(request: Request) -> User:
    user = getattr(request.state, "current_user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden. Admin privileges required.",
        )
    return user


@router.get("/candidates", summary="Get all candidate profiles with their interview metadata")
def get_candidates(
    request: Request,
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    _require_admin(request)
    
    # Query all users with role 'candidate'
    candidates = db.query(User).filter(User.role == "candidate").all()
    results = []
    
    for cand in candidates:
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == cand.id).first()
        sessions = db.query(InterviewSession).filter(InterviewSession.candidate_id == cand.id).all()
        coding_subs = db.query(CodingSubmission).filter(CodingSubmission.user_id == cand.id).all()
        
        # Calculate stats
        interviews_completed = sum(1 for s in sessions if s.status == "COMPLETED")
        scores = [s.cumulative_score for s in sessions if s.status == "COMPLETED"]
        avg_score = sum(scores) / len(scores) if scores else 0.0
        best_score = max(scores) if scores else 0.0
        
        coding_scores = [c.score for c in coding_subs]
        avg_coding_score = sum(coding_scores) / len(coding_scores) if coding_scores else 0.0
        
        latest_interview = "N/A"
        if sessions:
            latest_session = max(sessions, key=lambda s: s.created_at)
            latest_interview = latest_session.created_at.strftime("%Y-%m-%d %H:%M")
        
        results.append({
            "id": cand.id,
            "username": cand.username,
            "email": cand.email,
            "resume_score": profile.resume_score if profile else 0,
            "interviews_completed": interviews_completed,
            "avg_score": round(avg_score, 1),
            "best_score": round(best_score, 1),
            "avg_coding_score": round(avg_coding_score, 1),
            "latest_interview": latest_interview,
            "status": "Active" if sessions else "Idle"
        })
        
    return results


@router.get("/interviews/{candidate_id}", summary="Get all interview report metadata and coding scores for a candidate")
def get_candidate_details(
    candidate_id: int,
    request: Request,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    _require_admin(request)
    
    cand = db.get(User, candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")
        
    sessions = db.query(InterviewSession).filter(InterviewSession.candidate_id == candidate_id).all()
    coding_subs = db.query(CodingSubmission).filter(CodingSubmission.user_id == candidate_id).all()
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == candidate_id).first()
    
    interview_history = []
    for s in sessions:
        report = db.query(Report).filter(Report.session_id == s.id).first()
        interview_history.append({
            "id": s.id,
            "job_role": s.job_role,
            "difficulty": s.difficulty,
            "status": s.status,
            "score": round(s.cumulative_score, 1),
            "verdict": report.hiring_recommendation if report else "Pending",
            "created_at": s.created_at.strftime("%Y-%m-%d %H:%M")
        })
        
    coding_history = []
    for c in coding_subs:
        coding_history.append({
            "id": c.id,
            "challenge_title": c.challenge.title if c.challenge else "Challenge",
            "language": c.language,
            "status": c.status,
            "score": c.score,
            "complexity": c.complexity,
            "code_quality": c.code_quality,
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M")
        })
        
    import json
    parsed_skills = []
    if profile:
        try:
            parsed_skills = json.loads(profile.strong_skills or "[]") + json.loads(profile.weak_skills or "[]")
        except Exception:
            pass
            
    return {
        "candidate": {
            "id": cand.id,
            "username": cand.username,
            "email": cand.email,
        },
        "resume_score": profile.resume_score if profile else 0,
        "skills": parsed_skills,
        "interviews": interview_history,
        "coding": coding_history
    }


@router.get("/analytics", summary="Get aggregated dashboard stats and analytical distributions")
def get_analytics(
    request: Request,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    _require_admin(request)
    
    total_candidates = db.query(User).filter(User.role == "candidate").count()
    total_interviews = db.query(InterviewSession).count()
    completed_interviews = db.query(InterviewSession).filter(InterviewSession.status == "COMPLETED").count()
    
    # Calculate pass rate (verdict: Ready for Interview)
    reports = db.query(Report).all()
    passed = sum(1 for r in reports if r.hiring_recommendation == "Ready for Interview")
    pass_rate = (passed / len(reports) * 100) if reports else 0.0
    
    # Average score
    scores = [s.cumulative_score for s in db.query(InterviewSession).filter(InterviewSession.status == "COMPLETED").all()]
    avg_score = sum(scores) / len(scores) if scores else 0.0
    top_score = max(scores) if scores else 0.0
    
    # Coding Average
    coding_scores = [c.score for c in db.query(CodingSubmission).all()]
    avg_coding = sum(coding_scores) / len(coding_scores) if coding_scores else 0.0
    
    # Score distribution
    score_dist = {"0-4": 0, "4-6": 0, "6-8": 0, "8-10": 0}
    for s in scores:
        if s < 4.0:
            score_dist["0-4"] += 1
        elif s < 6.0:
            score_dist["4-6"] += 1
        elif s < 8.0:
            score_dist["6-8"] += 1
        else:
            score_dist["8-10"] += 1
            
    # Role distribution
    roles = db.query(InterviewSession.job_role, func.count(InterviewSession.id)).group_by(InterviewSession.job_role).all()
    role_dist = {r[0]: r[1] for r in roles}
    
    return {
        "metrics": {
            "total_candidates": total_candidates,
            "total_interviews": total_interviews,
            "completed_interviews": completed_interviews,
            "pass_rate": round(pass_rate, 1),
            "avg_score": round(avg_score, 1),
            "top_score": round(top_score, 1),
            "avg_coding_score": round(avg_coding, 1)
        },
        "distributions": {
            "score": score_dist,
            "role": role_dist
        }
    }
