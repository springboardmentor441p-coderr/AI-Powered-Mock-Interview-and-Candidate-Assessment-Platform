import os
from flask import Flask, request, jsonify
from parser import extract_resume_details
from database import get_db_connection

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
# Upload + Parse + Store
# -----------------------
@app.route("/upload", methods=["POST"])
def upload_resume():

    # Check file
    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded"})

    file = request.files["resume"]

    if file.filename == "":
        return jsonify({"error": "No file selected"})

    # Save uploaded resume
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)


    # Extract resume details
    details = extract_resume_details(filepath)


    # Save required details into SQLite
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO resumes (
                name,
                email,
                phone,
                skills,
                education,
                experience,
                projects,
                resume_path
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            details.get("name", "Not mentioned"),
            details.get("email", "Not mentioned"),
            details.get("phone", "Not mentioned"),
            ", ".join(details.get("skills", [])) if details.get("skills") else "Not mentioned",
            details.get("education", "Not mentioned"),
            details.get("experience", "Fresher"),
            details.get("projects", "Not mentioned"),
            filepath
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