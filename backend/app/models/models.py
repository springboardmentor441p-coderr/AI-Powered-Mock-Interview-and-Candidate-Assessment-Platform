import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    target_role = Column(String(255), default="Software Engineer")
    experience_level = Column(String(50), default="Mid-Level")
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    job_descriptions = relationship("JobDescription", back_populates="user", cascade="all, delete-orphan")
    assessment_sessions = relationship("AssessmentSession", back_populates="user", cascade="all, delete-orphan")
    interview_sessions = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    raw_text = Column(Text, nullable=True)
    extracted_skills = Column(JSON, default=list)
    parsed_experience = Column(JSON, default=dict)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="resumes")
    interview_sessions = relationship("InterviewSession", back_populates="resume")


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    company = Column(String(255), default="Target Enterprise")
    raw_text = Column(Text, nullable=False)
    extracted_skills = Column(JSON, default=list)
    key_responsibilities = Column(JSON, default=list)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="job_descriptions")
    assessment_sessions = relationship("AssessmentSession", back_populates="job_description")
    interview_sessions = relationship("InterviewSession", back_populates="job_description")


class AssessmentSession(Base):
    __tablename__ = "assessment_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    jd_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=True)
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="completed") # pending, in_progress, completed
    total_score = Column(Float, default=0.0)
    time_taken_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="assessment_sessions")
    job_description = relationship("JobDescription", back_populates="assessment_sessions")
    questions = relationship("AssessmentQuestion", back_populates="session", cascade="all, delete-orphan")
    answers = relationship("AssessmentAnswer", back_populates="session", cascade="all, delete-orphan")


class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("assessment_sessions.id"), nullable=False)
    question_type = Column(String(50), nullable=False) # MCQ, Coding, Scenario, Technical, Logical, Behavioral
    title = Column(String(255), nullable=False)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=True) # For MCQs
    correct_answer = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    code_template = Column(Text, nullable=True)

    session = relationship("AssessmentSession", back_populates="questions")
    answers = relationship("AssessmentAnswer", back_populates="question")


class AssessmentAnswer(Base):
    __tablename__ = "assessment_answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("assessment_sessions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("assessment_questions.id"), nullable=False)
    user_submission = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    score = Column(Float, default=0.0)
    feedback = Column(Text, nullable=True)

    session = relationship("AssessmentSession", back_populates="answers")
    question = relationship("AssessmentQuestion", back_populates="answers")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    jd_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=True)
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="completed")
    avatar_personality = Column(String(50), default="Professional Tech Lead")
    resume_jd_match_percent = Column(Float, default=85.0)
    duration_seconds = Column(Integer, default=300)
    video_recording_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="interview_sessions")
    resume = relationship("Resume", back_populates="interview_sessions")
    job_description = relationship("JobDescription", back_populates="interview_sessions")
    questions = relationship("InterviewQuestion", back_populates="session", cascade="all, delete-orphan")
    answers = relationship("InterviewAnswer", back_populates="session", cascade="all, delete-orphan")
    transcripts = relationship("Transcript", back_populates="session", cascade="all, delete-orphan")
    score = relationship("Score", back_populates="session", uselist=False, cascade="all, delete-orphan")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    question_order = Column(Integer, default=1)
    category = Column(String(50), default="Technical") # Resume Skills, Projects, Experience, JD Skills, Missing Skills
    question_text = Column(Text, nullable=False)
    expected_answer_keypoints = Column(JSON, default=list)

    session = relationship("InterviewSession", back_populates="questions")
    answers = relationship("InterviewAnswer", back_populates="question")


class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("interview_questions.id"), nullable=False)
    candidate_audio_transcript = Column(Text, nullable=False)
    ideal_response_suggestion = Column(Text, nullable=True)
    score = Column(Float, default=8.5)
    feedback = Column(Text, nullable=True)

    session = relationship("InterviewSession", back_populates="answers")
    question = relationship("InterviewQuestion", back_populates="answers")


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    speaker = Column(String(50), nullable=False) # "AI Avatar" or "Candidate"
    text = Column(Text, nullable=False)
    timestamp_seconds = Column(Float, default=0.0)

    session = relationship("InterviewSession", back_populates="transcripts")


class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    overall_score = Column(Float, default=88.5)
    technical_knowledge = Column(Float, default=90.0)
    communication = Column(Float, default=85.0)
    confidence = Column(Float, default=86.0)
    professionalism = Column(Float, default=92.0)
    problem_solving = Column(Float, default=88.0)
    eye_contact = Column(Float, default=89.0)
    emotion_control = Column(Float, default=87.0)
    voice_quality = Column(Float, default=84.0)

    session = relationship("InterviewSession", back_populates="score")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    report_type = Column(String(50), default="interview") # interview or assessment
    reference_id = Column(Integer, nullable=False) # session_id
    summary = Column(Text, nullable=False)
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    recommendations = Column(JSON, default=list)
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="reports")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")
