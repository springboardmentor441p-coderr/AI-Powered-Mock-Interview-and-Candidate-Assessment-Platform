import sqlite3

conn = sqlite3.connect("smarthire.db")
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(resumes)")

for row in cursor.fetchall():
    print(row)

conn.close()