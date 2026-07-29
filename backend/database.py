import sqlite3
import os


DATABASE_NAME = os.path.join(
    os.path.dirname(__file__),
    "smarthire.db"
)

print("USING DATABASE:", DATABASE_NAME)


def get_db_connection():

    conn = sqlite3.connect(
        DATABASE_NAME,
        timeout=10
    )

    conn.row_factory = sqlite3.Row

    return conn


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
    # Add status column if missing
    # -----------------------

    cur.execute("PRAGMA table_info(resumes)")

    resume_columns = [
        column[1]
        for column in cur.fetchall()
    ]

    if "status" not in resume_columns:

        cur.execute("""
            ALTER TABLE resumes
            ADD COLUMN status TEXT DEFAULT 'Pending'
        """)

        print("Status column added successfully.")

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

            recommendation TEXT,

            recommendation_reason TEXT,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        )
    """)

    # -----------------------
    # Check existing columns
    # -----------------------

    cur.execute("PRAGMA table_info(interview_results)")

    interview_columns = [
        column[1]
        for column in cur.fetchall()
    ]

    # -----------------------
    # Add recommendation column
    # -----------------------

    if "recommendation" not in interview_columns:

        cur.execute("""
            ALTER TABLE interview_results
            ADD COLUMN recommendation TEXT
        """)

        print("Recommendation column added.")

    # -----------------------
    # Add recommendation reason
    # -----------------------

    if "recommendation_reason" not in interview_columns:

        cur.execute("""
            ALTER TABLE interview_results
            ADD COLUMN recommendation_reason TEXT
        """)

        print("Recommendation reason column added.")

    # -----------------------
    # Add interview status
    # -----------------------

    if "interview_status" not in interview_columns:

        cur.execute("""
            ALTER TABLE interview_results
            ADD COLUMN interview_status TEXT DEFAULT 'Completed'
        """)

        print("Interview status column added.")

    # -----------------------
    # Add completion reason
    # -----------------------

    if "completion_reason" not in interview_columns:

        cur.execute("""
            ALTER TABLE interview_results
            ADD COLUMN completion_reason TEXT
        """)

        print("Completion reason column added.")

    # -----------------------
    # Interview Answers Table
    # -----------------------

    cur.execute("""
        CREATE TABLE IF NOT EXISTS interview_answers (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            candidate_email TEXT,

            question TEXT,

            answer TEXT,

            score INTEGER,

            feedback TEXT,

            strengths TEXT,

            improvements TEXT,

            ideal_answer TEXT,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        )
    """)

    conn.commit()

    conn.close()


# Create tables when application starts
create_table()