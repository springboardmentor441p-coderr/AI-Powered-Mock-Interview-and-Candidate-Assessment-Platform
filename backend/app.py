import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from database import get_db_connection
from parser import extract_resume_details
from evaluator import evaluate_interview
app = Flask(__name__)
CORS(app)

# -----------------------
# Database
# -----------------------



# -----------------------
# Upload Folder
# -----------------------

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# -----------------------
# Get All Candidates
# -----------------------

@app.route("/candidates", methods=["GET"])
def get_all_candidates():

    try:

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                name,
                email,
                phone,
                skills,
                education,
                experience,
                projects,
                certifications,
                languages
            FROM resumes
            ORDER BY id DESC
            """
        )

        rows = cursor.fetchall()
        conn.close()

        candidates = []

        for row in rows:

            candidates.append({

                "name": row[0],
                "email": row[1],
                "phone": row[2],
                "skills": row[3],
                "education": row[4],
                "experience": row[5],
                "projects": row[6],
                "certifications": row[7],
                "languages": row[8]

            })

        return jsonify(candidates)

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

# -----------------------
# Save Interview Result
# -----------------------

@app.route("/save-interview", methods=["POST"])
def save_interview():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No JSON data received"
            }), 400

        candidate_email = data.get("email")
        answers = data.get("answers")

        if not candidate_email or not answers:
            return jsonify({
                "error": "Email or answers missing"
            }), 400


        # -----------------------
        # Evaluate Interview
        # -----------------------

        evaluation = evaluate_interview(answers)


        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO interview_results
            (
                candidate_email,
                answers,
                score,
                technical_score,
                communication_score,
                feedback
            )

            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                candidate_email,
                str(answers),
                evaluation["score"],
                evaluation["technical_score"],
                evaluation["communication_score"],
                evaluation["feedback"]
            )
        )

        conn.commit()
        conn.close()

        return jsonify({

            "message": "Interview saved successfully",

            "score": evaluation["score"],

            "technical_score": evaluation["technical_score"],

            "communication_score": evaluation["communication_score"],

            "feedback": evaluation["feedback"]

        }), 200


    except Exception as e:

        print("SAVE INTERVIEW ERROR:", e)

        return jsonify({

            "error": str(e)

        }), 500
# -----------------------
# Upload Resume
# -----------------------

@app.route("/upload", methods=["POST"])
def upload_resume():

    try:

        if "resume" not in request.files:

            return jsonify({
                "error": "No file uploaded"
            }), 400


        file = request.files["resume"]


        if file.filename == "":

            return jsonify({
                "error": "No file selected"
            }), 400



        filepath = os.path.join(
            UPLOAD_FOLDER,
            file.filename
        )


        file.save(filepath)


        print("File saved:", filepath)



        # Extract resume details

        details = extract_resume_details(filepath)


        print("Extracted Details:")
        print(details)



        conn = get_db_connection()

        cursor = conn.cursor()



        # -----------------------
        # Check Duplicate Email
        # -----------------------

        cursor.execute(
            """
            SELECT id 
            FROM resumes
            WHERE email = ?
            """,
            (details["email"],)
        )


        existing_candidate = cursor.fetchone()



        if existing_candidate:


            conn.close()


            return jsonify({

                "message": "Resume already uploaded for this email",

                "data": details

            })





        # -----------------------
        # Insert New Resume
        # -----------------------

        cursor.execute(
            """
            INSERT INTO resumes
            (
                name,
                email,
                phone,
                skills,
                education,
                experience,
                projects,
                certifications,
                languages,
                resume_path
            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

            """,

            (
                details["name"],
                details["email"],
                details["phone"],
                ", ".join(details["skills"]),
                details["education"],
                details["experience"],
                details["projects"],
                details["certifications"],
                details["languages"],
                filepath
            )

        )


        conn.commit()

        conn.close()



        return jsonify({

            "message": "Resume uploaded successfully",

            "data": details

        })



    except Exception as e:


        print("ERROR:", e)


        return jsonify({

            "error": str(e)

        }), 500
# -----------------------
# Get Latest Candidate
# -----------------------

@app.route("/candidate", methods=["GET"])
def get_candidate():

    try:

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                name,
                email,
                phone,
                skills,
                education,
                experience,
                projects,
                certifications,
                languages
            FROM resumes
            ORDER BY id DESC
            LIMIT 1
            """
        )

        row = cursor.fetchone()

        conn.close()

        if row:

            return jsonify({

                "name": row[0],
                "email": row[1],
                "phone": row[2],
                "skills": row[3].split(", ") if row[3] else [],
                "education": row[4],
                "experience": row[5],
                "projects": row[6],
                "certifications": row[7],
                "languages": row[8]

            })

        return jsonify({

            "message": "No candidate found"

        })

    except Exception as e:

        return jsonify({

            "error": str(e)

        }), 500

# -----------------------
# Get Interview Results
# -----------------------

@app.route("/interview-results", methods=["GET"])
def get_interview_results():

    try:

        conn = get_db_connection()

        cursor = conn.cursor()


        cursor.execute(
            """
            SELECT
                candidate_email,
                answers,
                score,
                feedback,
                created_at

            FROM interview_results

            ORDER BY id DESC

            LIMIT 1
            """
        )


        row = cursor.fetchone()

        conn.close()



        if row:

            return jsonify({

                "email": row[0],

                "answers": row[1],

                "score": row[2],

                "feedback": row[3],

                "date": row[4]

            })



        return jsonify({

            "message": "No interview results found"

        })



    except Exception as e:


        return jsonify({

            "error": str(e)

        }), 500
# -----------------------
# Run App
# -----------------------

if __name__ == "__main__":
    app.run(debug=True)