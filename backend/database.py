import sqlite3
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger("smarthire.database")

SQLALCHEMY_DATABASE_URL = "sqlite:///./smarthire.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def sync_database_schema():
    """Safely synchronizes SQLite tables with missing columns via ALTER TABLE."""
    try:
        db_path = "./smarthire.db"
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # 1. Sync interview_sessions columns
        cursor.execute("PRAGMA table_info(interview_sessions);")
        session_cols = [row[1] for row in cursor.fetchall()]

        session_alterations = [
            ("ended_reason", "TEXT DEFAULT 'completed'"),
            ("started_at", "DATETIME"),
            ("finished_at", "DATETIME"),
            ("questions_data", "JSON")
        ]

        for col_name, col_def in session_alterations:
            if col_name not in session_cols:
                logger.info(f"Adding missing column '{col_name}' to interview_sessions table")
                cursor.execute(f"ALTER TABLE interview_sessions ADD COLUMN {col_name} {col_def};")

        # 2. Sync question_answers columns
        cursor.execute("PRAGMA table_info(question_answers);")
        qa_cols = [row[1] for row in cursor.fetchall()]

        if "question_index" not in qa_cols:
            logger.info("Adding missing column 'question_index' to question_answers table")
            cursor.execute("ALTER TABLE question_answers ADD COLUMN question_index INTEGER DEFAULT 1;")

        conn.commit()
        conn.close()
    except Exception as exc:
        logger.warning(f"Database schema sync warning: {exc}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
