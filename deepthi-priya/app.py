import psycopg2
from flask import Flask, request, jsonify
from parser import extract_resume_details
import os

app = Flask(__name__)

# -----------------------
# Upload folder setup
# -----------------------
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# -----------------------
# Home route
# -----------------------
@app.route("/")
def home():
    return "SmartHire AI Resume Parser is Running!"

# -----------------------
# PostgreSQL connection
# -----------------------
def get_db_connection():
    conn = psycopg2.connect(
        host="localhost",
        database="smarthire_ai",
        user="postgres",
        password="Deepthi@18"   
    )
    return conn

# -----------------------
# Test DB connection
# -----------------------
@app.route("/test-db")
def test_db():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT 1;")
    result = cur.fetchone()
    conn.close()
    return jsonify({"message": "DB Connected Successfully", "result": result})

# -----------------------
# Upload + Parse + Store
# -----------------------
@app.route("/upload", methods=["POST"])
def upload_resume():

    # check file
    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded"})

    file = request.files["resume"]

    # save file
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    # parse resume
    details = extract_resume_details(filepath)

    # save into database
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO resumes (
                name, email, phone, education, skills,
                experience, projects, certifications,
                languages, resume_text, uploaded_at
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,CURRENT_TIMESTAMP)
        """, (
            details.get("name"),
            details.get("email"),
            details.get("phone"),
            details.get("education"),
            details.get("skills"),
            details.get("experience"),
            details.get("projects"),
            details.get("certifications"),
            details.get("languages"),
            details.get("resume_text")
        ))

        conn.commit()
        cur.close()
        conn.close()

    except Exception as e:
        return jsonify({"error": str(e)})

    return jsonify({
        "message": "Resume uploaded and stored successfully",
        "data": details
    })

# -----------------------
# Run server
# -----------------------
if __name__ == "__main__":
    app.run(debug=True)