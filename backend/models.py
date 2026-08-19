from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="candidate") # candidate, recruiter, admin
    created_at = Column(DateTime, default=datetime.utcnow)

    resumes = relationship("Resume", back_populates="user")
    sessions = relationship("InterviewSession", back_populates="user")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    parsed_skills = Column(JSON) # e.g. ["Python", "React", "SQL"]
    parsed_experience = Column(String)
    parsed_education = Column(String)
    parsed_summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="resumes")

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    category = Column(String) # Technical, HR, Behavioral, Aptitude
    difficulty = Column(String) # Easy, Medium, Hard
    domain = Column(String) # Software Eng, Data Science, Product, HR
    total_questions = Column(Integer, default=5)
    
    # Evaluation Scores (0-100)
    communication_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    technical_score = Column(Float, default=0.0)
    professionalism_score = Column(Float, default=0.0)
    overall_score = Column(Float, default=0.0)
    performance_rating = Column(String, default="Pending") # Excellent, Good, Average, Needs Improvement, Poor

    # Analytics Data
    filler_word_count = Column(Integer, default=0)
    words_per_minute = Column(Float, default=0.0)
    eye_contact_ratio = Column(Float, default=0.0)
    strengths = Column(JSON)
    weaknesses = Column(JSON)
    improvement_tips = Column(JSON)

    status = Column(String, default="active") # active, completed, ended_by_candidate
    ended_reason = Column(String, default="completed") # completed, ended_by_candidate
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    questions_data = Column(JSON, nullable=True) # Stored questions list for page refresh recovery
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sessions")
    answers = relationship("QuestionAnswer", back_populates="session")

class QuestionAnswer(Base):
    __tablename__ = "question_answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"))
    question_index = Column(Integer, default=1)
    question_text = Column(Text)
    category = Column(String)
    candidate_answer = Column(Text)
    transcript = Column(Text)
    filler_words_detected = Column(JSON)
    grammar_score = Column(Float)
    relevance_score = Column(Float)
    eye_contact_percentage = Column(Float)
    feedback_notes = Column(Text)

    session = relationship("InterviewSession", back_populates="answers")
