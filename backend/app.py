import os
import requests
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from database import get_db_connection
from parser import extract_resume_details
from evaluator import evaluate_interview
from ultravox_service import create_ultravox_session
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
def get_candidates():

    conn = get_db_connection()
    cursor = conn.cursor()


    # Total candidates
    cursor.execute("""
        SELECT COUNT(*) FROM resumes
    """)
    total_candidates = cursor.fetchone()[0]


    # Completed interviews
    cursor.execute("""
        SELECT COUNT(*)
        FROM interview_results
        WHERE answers IS NOT NULL
        AND answers != ''
    """)
    completed_interviews = cursor.fetchone()[0]


    # Average score
    cursor.execute("""
        SELECT AVG(score)
        FROM interview_results
        WHERE score IS NOT NULL
    """)
    average_score = cursor.fetchone()[0] or 0


    # Shortlisted count
    cursor.execute("""
        SELECT COUNT(*)
        FROM resumes
        WHERE status = 'Shortlisted'
    """)
    shortlisted = cursor.fetchone()[0]



    # Get candidate details
    cursor.execute("""
        SELECT

            r.name,
            r.email,
            r.phone,
            r.skills,
            r.experience,
            r.education,
            r.projects,
            r.certifications,
            r.languages,

            i.score,
            i.technical_score,
            i.communication_score,
            i.feedback,

            i.recommendation,
            i.recommendation_reason,

            i.answers,
            i.created_at,

            r.status


        FROM resumes r


        LEFT JOIN interview_results i

        ON r.email = i.candidate_email


        AND i.id = (

            SELECT id
            FROM interview_results

            WHERE candidate_email = r.email

            ORDER BY id DESC

            LIMIT 1

        )

    """)


    rows = cursor.fetchall()


    print("TOTAL ROWS:", len(rows))


    candidates = []


    for row in rows:

        print("DATABASE ROW:", row[0], row[1])


        status = "Pending"


        # Interview completed only when transcript exists
        if row[15] is not None and row[15] != "":
            status = "Interview Completed"



        # Recruiter decision
        if row[17] in ["Shortlisted", "Rejected"]:
            status = row[17]



        candidates.append({

            "name": row[0],
            "email": row[1],
            "phone": row[2],

            "skills": row[3],
            "experience": row[4],
            "education": row[5],
            "projects": row[6],
            "certifications": row[7],
            "languages": row[8],


            "score": row[9],
            "technical_score": row[10],
            "communication_score": row[11],


            "feedback": row[12],


            # Only recommendation shown in dashboard
            "recommendation": row[13],

            "recommendation_reason": row[14],


            # Used only in View page
            "transcript": row[15],


            "interview_date": row[16],


            "status": status

        })



    # Find top candidate

    completed_candidates = [

        c for c in candidates

        if c["score"] is not None

    ]


    top_candidate = None


    if completed_candidates:

        top_candidate = max(
            completed_candidates,
            key=lambda x: x["score"]
        )



    conn.close()



    return jsonify({

        "top_candidate": top_candidate,


        "stats": {

            "total_candidates": total_candidates,

            "completed_interviews": completed_interviews,

            "average_score": round(average_score),

            "shortlisted": shortlisted

        },


        "candidates": candidates

    })

@app.route("/save-interview", methods=["POST"])
def save_interview():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No data received"
            }), 400


        candidate_email = data.get("email")
        transcript = data.get("transcript")


        if not candidate_email or not transcript:

            return jsonify({
                "error": "Email or transcript missing"
            }), 400



        print("========== TRANSCRIPT ==========")
        print(transcript)



        # AI Evaluation
        evaluation = evaluate_interview(
            transcript,
            candidate_email
        )
        print("EVALUATION:", evaluation)


        # -----------------------------
        # Generate AI Recommendation
        # -----------------------------

        score = evaluation["score"]


        if score >= 80:

            recommendation = "Recommended"


        elif score >= 60:

            recommendation = "Consider"


        else:

            recommendation = "Not Recommended"



        recommendation_reason = evaluation["feedback"]



        # Database connection

        conn = get_db_connection()

        cursor = conn.cursor()



        # Save interview result

        cursor.execute(
            """
            INSERT INTO interview_results
            (
                candidate_email,
                answers,
                score,
                technical_score,
                communication_score,
                feedback,
                recommendation,
                recommendation_reason
            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?)

            """,

            (
                candidate_email,
                transcript,

                evaluation["score"],

                evaluation["technical_score"],

                evaluation["communication_score"],

                evaluation["feedback"],

                recommendation,

                recommendation_reason
            )

        )



        # Update resume status

        cursor.execute(
            """
            UPDATE resumes

            SET status = 'Interview Completed'

            WHERE email = ?

            """,

            (candidate_email,)

        )



        conn.commit()

        conn.close()



        return jsonify({

            "message": "Interview saved successfully",

            "recommendation": recommendation

        })



    except Exception as e:


        print(e)


        return jsonify({

            "error": str(e)

        }), 500
@app.route("/interview-history/<email>", methods=["GET"])
def interview_history(email):

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            id,
            score,
            technical_score,
            communication_score,
            feedback,
            answers,
            created_at
        FROM interview_results
        WHERE candidate_email = ?
        ORDER BY id DESC
    """, (email,))

    rows = cursor.fetchall()
    conn.close()

    history = []

    for row in rows:
        history.append({
            "id": row[0],
            "score": row[1],
            "technical_score": row[2],
            "communication_score": row[3],
            "feedback": row[4],
            "answers": row[5],
            "created_at": row[6]
        })

    return jsonify(history)
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

@app.route("/update-status", methods=["POST"])
def update_status():
    try:
        data = request.get_json()

        email = data.get("email")
        status = data.get("status")

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE resumes
            SET status = ?
            WHERE email = ?
        """, (status, email))

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Status updated successfully"
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500
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

        cursor.execute("""
    SELECT
        candidate_email,
        score,
        technical_score,
        communication_score,
        feedback,
        recommendation,
        recommendation_reason,
        created_at
    FROM interview_results
    ORDER BY id DESC
    LIMIT 1
""")

        row = cursor.fetchone()

        conn.close()

        if row:

            return jsonify({

    "email": row[0],

    "overall_score": row[1],

    "technical_score": row[2],

    "communication_score": row[3],

    "overall_feedback": row[4],

    "recommendation": row[5],

    "recommendation_reason": row[6],

    "date": row[7]

})

        return jsonify({

            "message": "No interview results found"

        })

    except Exception as e:

        return jsonify({

            "error": str(e)

        }), 500


# -----------------------
# Generate AI Interview Questions
# -----------------------


load_dotenv()

ULTRAVOX_API_KEY = os.getenv("ULTRAVOX_API_KEY")
print("Ultravox Key:", ULTRAVOX_API_KEY[:12])

@app.route("/ultravox/session", methods=["POST"])
def ultravox_session():

    try:
        data = request.get_json()
        email = data.get("email")

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                name,
                email,
                skills,
                education,
                experience,
                projects,
                certifications,
                languages
            FROM resumes
            WHERE email = ?
        """, (email,))

        row = cursor.fetchone()
        conn.close()

        if not row:
            return jsonify({"error": "Candidate not found"}), 404

        candidate = {
            "name": row[0],
            "email": row[1],
            "skills": row[2],
            "education": row[3],
            "experience": row[4],
            "projects": row[5],
            "certifications": row[6],
            "languages": row[7]
        }

        response, status = create_ultravox_session(candidate)

        return jsonify(response), status

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/update-interview-status", methods=["POST"])
def update_interview_status():

    try:

        data = request.get_json()

        email = data.get("email")
        status = data.get("status")


        conn = get_db_connection()
        cursor = conn.cursor()


        cursor.execute(
            """
            UPDATE resumes
            SET status = ?
            WHERE email = ?
            """,
            (status, email)
        )


        conn.commit()
        conn.close()


        return jsonify({
            "message": "Status updated"
        })


    except Exception as e:

        return jsonify({
            "error": str(e)
        }),500
# -----------------------
# Run App
# -----------------------

if __name__ == "__main__":
    app.run(debug=True)