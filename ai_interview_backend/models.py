from sqlalchemy import Column, Integer, String
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email_or_mobile = Column(String, unique=True, index=True) 
    password = Column(String) 

class InterviewSession(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)  # <-- MISSING FIELD ADDED
    interview_type = Column(String, index=True)
    role = Column(String, index=True)
    difficulty = Column(String)
    topic_count = Column(Integer)
    score = Column(Integer)    # <-- MISSING FIELD ADDED

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_path = Column(String)