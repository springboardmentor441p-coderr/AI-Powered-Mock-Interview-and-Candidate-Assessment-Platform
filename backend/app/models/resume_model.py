from datetime import datetime

from app.extensions import db


class Resume(db.Model):
    __tablename__ = "resumes"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    candidate_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    file_name = db.Column(
        db.String(255),
        nullable=False
    )

    file_path = db.Column(
        db.String(500),
        nullable=False
    )

    file_size = db.Column(
        db.Integer,
        default=0
    )

    file_type = db.Column(
        db.String(50),
        default="pdf"
    )

    extracted_text = db.Column(
        db.Text
    )

    extracted_skills = db.Column(
        db.Text
    )

    experience = db.Column(
        db.String(255)
    )

    education = db.Column(
        db.Text
    )

    resume_score = db.Column(
        db.Float,
        default=0
    )

    ai_summary = db.Column(
        db.Text
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
    back_populates="resumes"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "candidate_id": self.candidate_id,
            "file_name": self.file_name,
            "file_path": self.file_path,
            "file_size": self.file_size,
            "file_type": self.file_type,
            "extracted_text": self.extracted_text,
            "extracted_skills": self.extracted_skills,
            "experience": self.experience,
            "education": self.education,
            "resume_score": self.resume_score,
            "ai_summary": self.ai_summary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }