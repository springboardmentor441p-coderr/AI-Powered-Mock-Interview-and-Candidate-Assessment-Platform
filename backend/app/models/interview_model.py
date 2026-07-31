from datetime import datetime

from app.extensions import db


class Interview(db.Model):
    __tablename__ = "interviews"

    id = db.Column(db.Integer, primary_key=True)

    candidate_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    job_role = db.Column(
        db.String(120),
        nullable=False
    )

    difficulty = db.Column(
        db.String(30),
        default="Intermediate"
    )

    interview_type = db.Column(
        db.String(50),
        default="Technical"
    )

    total_questions = db.Column(
        db.Integer,
        default=10
    )

    answered_questions = db.Column(
        db.Integer,
        default=0
    )

    score = db.Column(
        db.Float,
        default=0
    )

    confidence_score = db.Column(
        db.Float,
        default=0
    )

    communication_score = db.Column(
        db.Float,
        default=0
    )

    technical_score = db.Column(
        db.Float,
        default=0
    )

    status = db.Column(
        db.String(30),
        default="Pending"
    )

    feedback = db.Column(
        db.Text
    )

    recommendations = db.Column(
        db.Text
    )

    started_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    completed_at = db.Column(
        db.DateTime
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    candidate = db.relationship(
    "User",
    back_populates="interviews"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "candidate_id": self.candidate_id,
            "job_role": self.job_role,
            "difficulty": self.difficulty,
            "interview_type": self.interview_type,
            "total_questions": self.total_questions,
            "answered_questions": self.answered_questions,
            "score": self.score,
            "confidence_score": self.confidence_score,
            "communication_score": self.communication_score,
            "technical_score": self.technical_score,
            "status": self.status,
            "feedback": self.feedback,
            "recommendations": self.recommendations,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }