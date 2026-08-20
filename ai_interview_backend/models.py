from sqlalchemy import Column, Integer, String, Boolean, DateTime
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email_or_mobile = Column(String, unique=True, index=True) 
    password = Column(String) 
    # NEW: Profile Fields
    full_name = Column(String, default="")
    college = Column(String, default="")
    target_role = Column(String, default="")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    title = Column(String)
    message = Column(String)
    type = Column(String) # 'system', 'resume', or 'feedback'
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class InterviewSession(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)  
    interview_type = Column(String, index=True)
    role = Column(String, index=True)
    difficulty = Column(String)
    topic_count = Column(Integer)
    score = Column(Integer)    
    # NEW COLUMNS:
    duration = Column(String) 
    transcript = Column(String) # Will store the conversation as a JSON string
    
class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_path = Column(String)