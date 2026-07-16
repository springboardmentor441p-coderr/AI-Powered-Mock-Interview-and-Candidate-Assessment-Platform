from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

# --- User Table ---
class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(100), nullable=False)
    email         = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role          = Column(String(20), default="candidate")
    created_at    = Column(DateTime, default=datetime.utcnow)

    resumes       = relationship("Resume", back_populates="owner")


# --- Resume Table ---
class Resume(Base):
    __tablename__ = "resumes"

    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename       = Column(String(255), nullable=False)
    file_path      = Column(String(500), nullable=False)
    extracted_text = Column(Text, nullable=True)
    skills         = Column(Text, nullable=True)
    experience     = Column(Text, nullable=True)
    education      = Column(Text, nullable=True)
    summary        = Column(Text, nullable=True)
    uploaded_at    = Column(DateTime, default=datetime.utcnow)

    owner          = relationship("User", back_populates="resumes")
    jd_matches     = relationship("JDMatch", back_populates="resume")


# --- JD Match Table ---
class JDMatch(Base):
    __tablename__ = "jd_matches"

    id               = Column(Integer, primary_key=True, index=True)
    resume_id        = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    jd_text          = Column(Text, nullable=False)
    match_score      = Column(Float, nullable=True)
    matched_skills   = Column(Text, nullable=True)
    missing_skills   = Column(Text, nullable=True)
    is_eligible      = Column(String(10), default="pending")
    created_at       = Column(DateTime, default=datetime.utcnow)

    resume           = relationship("Resume", back_populates="jd_matches")