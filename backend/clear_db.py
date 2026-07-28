from app.database import engine, Base
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("DELETE FROM interview_answers;"))
    conn.execute(text("DELETE FROM interview_questions;"))
    conn.execute(text("DELETE FROM transcripts;"))
    conn.execute(text("DELETE FROM scores;"))
    conn.execute(text("DELETE FROM reports;"))
    conn.execute(text("DELETE FROM interview_sessions;"))
    conn.commit()
print("Database cleared cleanly!")
