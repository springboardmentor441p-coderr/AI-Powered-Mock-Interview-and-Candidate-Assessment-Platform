import sqlite3

DATABASE_NAME = "smarthire.db"


def get_db_connection():
    conn = sqlite3.connect(DATABASE_NAME)
    return conn


def create_table():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS resumes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        phone TEXT,
        skills TEXT,
        education TEXT,
        experience TEXT,
        projects TEXT,
        resume_path TEXT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()


create_table()