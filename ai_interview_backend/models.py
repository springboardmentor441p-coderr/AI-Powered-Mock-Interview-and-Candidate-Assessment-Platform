from sqlalchemy import Column, Integer, String
from database import Base

class InterviewSession(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    interview_type = Column(String, index=True)
    role = Column(String, index=True)
    difficulty = Column(String)
    topic_count = Column(Integer)

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_path = Column(String)