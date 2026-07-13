import sqlite3

DATABASE_NAME = "smarthire.db"


def get_db_connection():
    return sqlite3.connect(DATABASE_NAME, timeout=10)


def create_table():

    conn = get_db_connection()
    cur = conn.cursor()

    # -----------------------
    # Resume Table
    # -----------------------
    cur.execute("""
        CREATE TABLE IF NOT EXISTS resumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            phone TEXT,
            skills TEXT,
            education TEXT,
            experience TEXT,
            projects TEXT,
            certifications TEXT,
            languages TEXT,
            resume_path TEXT,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # -----------------------
    # Interview Results Table
    # -----------------------
    cur.execute("""
        CREATE TABLE IF NOT EXISTS interview_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            candidate_email TEXT,
            answers TEXT,
            score INTEGER,
            technical_score INTEGER,
            communication_score INTEGER,
            feedback TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
    """)

    conn.commit()
    conn.close()


create_table()