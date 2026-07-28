from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/report", tags=["PDF & Analysis Reports"])

@router.get("/summary/{session_id}")
def get_report_summary(session_id: int, db: Session = Depends(get_db)):
    return {
        "report_id": 101,
        "candidate_name": "Alex Vance",
        "target_role": "Senior Full-Stack AI Engineer",
        "date": "2026-07-21",
        "overall_score": 88.5,
        "resume_jd_match": 86.5,
        "assessment_score": 92.0,
        "eye_contact_score": 87.5,
        "communication_score": 87.5,
        "technical_score": 91.0,
        "confidence_score": 86.0,
        "strengths": [
            "Exceptional clarity in describing async state management & microservices",
            "High camera eye-contact (>87%) and controlled posture",
            "Strong algorithmic problem solving under pressure"
        ],
        "weaknesses": [
            "Slight hesitation when discussing Kafka event-streaming patterns",
            "Occasional volume dip during missing skill questions"
        ],
        "suggestions": [
            "Practice structuring 30-second STAR framework answers for gap topics",
            "Increase micro-pause duration prior to technical delivery"
        ]
    }
