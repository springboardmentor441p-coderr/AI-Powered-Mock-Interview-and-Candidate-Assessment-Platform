"""
SQLAlchemy database models for InterviewIQ.
"""
from datetime import datetime
from typing import Optional

from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db
from app.utils.constants import (
    ROLE_ADMIN,
    ROLE_CANDIDATE,
    ROLE_RECRUITER,
)


class Role(db.Model):
    """User role model."""

    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    users = db.relationship("User", back_populates="role", lazy="dynamic")

    def __repr__(self) -> str:
        return f"<Role {self.name}>"


class User(UserMixin, db.Model):
    """User account model."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256))
    full_name = db.Column(db.String(150))
    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=False)
    google_id = db.Column(db.String(255), unique=True, nullable=True)
    profile_image = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    last_login = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    role = db.relationship("Role", back_populates="users")
    resumes = db.relationship("Resume", back_populates="user", lazy="dynamic")
    interviews = db.relationship("Interview", back_populates="candidate", lazy="dynamic")
    system_logs = db.relationship("SystemLog", back_populates="user", lazy="dynamic")

    def set_password(self, password: str) -> None:
        """Hash and store password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verify password against hash."""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    @property
    def is_admin(self) -> bool:
        """Check if user is admin."""
        return self.role and self.role.name == ROLE_ADMIN

    @property
    def is_recruiter(self) -> bool:
        """Check if user is recruiter."""
        return self.role and self.role.name == ROLE_RECRUITER

    @property
    def is_candidate(self) -> bool:
        """Check if user is candidate."""
        return self.role and self.role.name == ROLE_CANDIDATE

    def __repr__(self) -> str:
        return f"<User {self.username}>"


class Admin(db.Model):
    """Admin profile extension."""

    __tablename__ = "admins"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True)
    department = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("admin_profile", uselist=False))


class Recruiter(db.Model):
    """Recruiter profile extension."""

    __tablename__ = "recruiters"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True)
    company = db.Column(db.String(150))
    designation = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref=db.backref("recruiter_profile", uselist=False))
    interview_templates = db.relationship(
        "InterviewTemplate", back_populates="recruiter", lazy="dynamic"
    )


class Resume(db.Model):
    """Uploaded resume model."""

    __tablename__ = "resumes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    raw_text = db.Column(db.Text)
    name = db.Column(db.String(150))
    email = db.Column(db.String(120))
    phone = db.Column(db.String(50))
    education = db.Column(db.Text)
    experience = db.Column(db.Text)
    projects = db.Column(db.Text)
    certifications = db.Column(db.Text)
    summary = db.Column(db.Text)
    missing_skills = db.Column(db.Text)
    is_primary = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user = db.relationship("User", back_populates="resumes")
    skills = db.relationship(
        "Skill", back_populates="resume", lazy="dynamic", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Resume {self.file_name}>"


class Skill(db.Model):
    """Skill extracted from resume."""

    __tablename__ = "skills"

    id = db.Column(db.Integer, primary_key=True)
    resume_id = db.Column(db.Integer, db.ForeignKey("resumes.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    proficiency = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    resume = db.relationship("Resume", back_populates="skills")


class InterviewTemplate(db.Model):
    """Recruiter-created interview template."""

    __tablename__ = "interview_templates"

    id = db.Column(db.Integer, primary_key=True)
    recruiter_id = db.Column(db.Integer, db.ForeignKey("recruiters.id"))
    name = db.Column(db.String(150), nullable=False)
    domain = db.Column(db.String(100))
    category = db.Column(db.String(50))
    difficulty = db.Column(db.String(20))
    question_count = db.Column(db.Integer, default=5)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    recruiter = db.relationship("Recruiter", back_populates="interview_templates")


class Interview(db.Model):
    """Interview session model."""

    __tablename__ = "interviews"

    id = db.Column(db.Integer, primary_key=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    resume_id = db.Column(db.Integer, db.ForeignKey("resumes.id"), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    domain = db.Column(db.String(100))
    category = db.Column(db.String(50))
    difficulty = db.Column(db.String(20))
    status = db.Column(db.String(30), default="scheduled")
    duration_minutes = db.Column(db.Integer, default=30)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    cancellation_reason = db.Column(db.Text)
    video_path = db.Column(db.String(500))
    audio_path = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    candidate = db.relationship("User", back_populates="interviews")
    resume = db.relationship("Resume")
    questions = db.relationship(
        "Question",
        back_populates="interview",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
    score = db.relationship(
        "Score", back_populates="interview", uselist=False, cascade="all, delete-orphan"
    )
    report = db.relationship(
        "Report", back_populates="interview", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Interview {self.title}>"


class Question(db.Model):
    """Interview question model."""

    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True)
    interview_id = db.Column(db.Integer, db.ForeignKey("interviews.id"), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50))
    difficulty = db.Column(db.String(20))
    order_index = db.Column(db.Integer, default=0)
    time_limit_seconds = db.Column(db.Integer, default=120)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    interview = db.relationship("Interview", back_populates="questions")
    answer = db.relationship(
        "Answer", back_populates="question", uselist=False, cascade="all, delete-orphan"
    )


class Answer(db.Model):
    """Candidate answer to interview question."""

    __tablename__ = "answers"

    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.id"), nullable=False)
    answer_text = db.Column(db.Text)
    audio_path = db.Column(db.String(500))
    video_path = db.Column(db.String(500))
    duration_seconds = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    question = db.relationship("Question", back_populates="answer")
    speech_analysis = db.relationship(
        "SpeechAnalysis",
        back_populates="answer",
        uselist=False,
        cascade="all, delete-orphan",
    )
    emotion_analysis = db.relationship(
        "EmotionAnalysis",
        back_populates="answer",
        uselist=False,
        cascade="all, delete-orphan",
    )


class SpeechAnalysis(db.Model):
    """Speech analysis results."""

    __tablename__ = "speech_analyses"

    id = db.Column(db.Integer, primary_key=True)
    answer_id = db.Column(db.Integer, db.ForeignKey("answers.id"), unique=True)
    transcript = db.Column(db.Text)
    grammar_score = db.Column(db.Float, default=0.0)
    speaking_pace = db.Column(db.Float, default=0.0)
    filler_word_count = db.Column(db.Integer, default=0)
    filler_words = db.Column(db.Text)
    communication_score = db.Column(db.Float, default=0.0)
    pronunciation_score = db.Column(db.Float, default=0.0)
    word_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    answer = db.relationship("Answer", back_populates="speech_analysis")


class EmotionAnalysis(db.Model):
    """Emotion and facial analysis results."""

    __tablename__ = "emotion_analyses"

    id = db.Column(db.Integer, primary_key=True)
    answer_id = db.Column(db.Integer, db.ForeignKey("answers.id"), unique=True)
    dominant_emotion = db.Column(db.String(50))
    happy_score = db.Column(db.Float, default=0.0)
    neutral_score = db.Column(db.Float, default=0.0)
    sad_score = db.Column(db.Float, default=0.0)
    nervous_score = db.Column(db.Float, default=0.0)
    eye_contact_score = db.Column(db.Float, default=0.0)
    confidence_score = db.Column(db.Float, default=0.0)
    attention_score = db.Column(db.Float, default=0.0)
    face_presence_score = db.Column(db.Float, default=0.0)
    frame_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    answer = db.relationship("Answer", back_populates="emotion_analysis")


class Score(db.Model):
    """AI evaluation scores for interview."""

    __tablename__ = "scores"

    id = db.Column(db.Integer, primary_key=True)
    interview_id = db.Column(db.Integer, db.ForeignKey("interviews.id"), unique=True)
    technical_score = db.Column(db.Float, default=0.0)
    communication_score = db.Column(db.Float, default=0.0)
    confidence_score = db.Column(db.Float, default=0.0)
    professionalism_score = db.Column(db.Float, default=0.0)
    overall_score = db.Column(db.Float, default=0.0)
    strengths = db.Column(db.Text)
    weaknesses = db.Column(db.Text)
    suggestions = db.Column(db.Text)
    recommended_courses = db.Column(db.Text)
    recommended_skills = db.Column(db.Text)
    ai_feedback = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    interview = db.relationship("Interview", back_populates="score")


class Report(db.Model):
    """Generated PDF report metadata."""

    __tablename__ = "reports"

    id = db.Column(db.Integer, primary_key=True)
    interview_id = db.Column(db.Integer, db.ForeignKey("interviews.id"), unique=True)
    file_path = db.Column(db.String(500))
    file_name = db.Column(db.String(255))
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)

    interview = db.relationship("Interview", back_populates="report")


class SystemLog(db.Model):
    """System activity log."""

    __tablename__ = "system_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    details = db.Column(db.Text)
    ip_address = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", back_populates="system_logs")
