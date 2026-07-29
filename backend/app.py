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

    try:

        conn = get_db_connection()
        cursor = conn.cursor()

        # -----------------------------
        # Total Candidates
        # -----------------------------
        cursor.execute("""
            SELECT COUNT(*)
            FROM resumes
        """)
        total_candidates = cursor.fetchone()[0]

        # -----------------------------
        # Completed Interviews
        # -----------------------------
        cursor.execute("""
            SELECT COUNT(DISTINCT candidate_email)
            FROM interview_results
            WHERE answers IS NOT NULL
            AND TRIM(answers) != ''
        """)
        completed_interviews = cursor.fetchone()[0]

        pending_interviews = total_candidates - completed_interviews

        # -----------------------------
        # Average Score
        # -----------------------------
        cursor.execute("""
            SELECT AVG(score)
            FROM interview_results
            WHERE id IN (
                SELECT MAX(id)
                FROM interview_results
                GROUP BY candidate_email
            )
            AND score IS NOT NULL
        """)

        average_score = round(cursor.fetchone()[0] or 0)

        # -----------------------------
        # Shortlisted Count
        # -----------------------------
        cursor.execute("""
            SELECT COUNT(*)
            FROM interview_results
            WHERE recruiter_status='Shortlisted'
            AND id IN (
                SELECT MAX(id)
                FROM interview_results
                GROUP BY candidate_email
            )
        """)

        shortlisted = cursor.fetchone()[0]

        # -----------------------------
        # Candidate List
        # -----------------------------
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

                i.interview_status,
                i.completion_reason,

                i.recruiter_status

            FROM resumes r

            LEFT JOIN interview_results i

            ON r.email=i.candidate_email

            AND i.id=(

                SELECT MAX(id)

                FROM interview_results

                WHERE candidate_email=r.email

            )

            ORDER BY r.name

        """)

        rows = cursor.fetchall()

        candidates = []

        for row in rows:

            transcript = row[15] if row[15] else ""

            if transcript.strip():
                interview_status = "Interview Completed"
            else:
                interview_status = "Pending Interview"

            recruiter_status = row[19] if row[19] else "Pending"

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

                "score": row[9] if row[9] is not None else None,

                "technical_score": row[10],

                "communication_score": row[11],

                "feedback": row[12],

                "recommendation": row[13] if row[13] else "N/A",

                "recommendation_reason": row[14],

                "transcript": transcript,

                "interview_date": row[16],

                "interview_status": interview_status,

                "completion_reason": row[18],

                "recruiter_status": recruiter_status

            })

        # -----------------------------
        # Top Candidate
        # -----------------------------
        completed = [
            c for c in candidates
            if c["score"] is not None
        ]

        top_candidate = None

        if completed:

            top_candidate = max(
                completed,
                key=lambda x: x["score"]
            )

        conn.close()

        return jsonify({

            "stats":{

                "total_candidates":total_candidates,

                "completed_interviews":completed_interviews,

                "pending_interviews":pending_interviews,

                "average_score":average_score,

                "shortlisted":shortlisted

            },

            "top_candidate":top_candidate,

            "candidates":candidates

        })

    except Exception as e:

        print("CANDIDATE API ERROR:", e)

        return jsonify({

            "error":str(e)

        }),500
#----save interview----

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



        # -----------------------------
        # AI Evaluation
        # -----------------------------

        evaluation = evaluate_interview(transcript)

        print("EVALUATION:", evaluation)
        interview_status = evaluation.get(
        "interview_status",
        "Completed")

        completion_reason = evaluation.get(
        "completion_reason", "")

        recommendation_reason = evaluation.get(
        "recommendation_reason",
        evaluation["feedback"])



        # -----------------------------
        # Generate AI Recommendation
        # -----------------------------

        score = evaluation.get("score", 0)


        if score >= 80:

            recommendation = "Recommended"


        elif score >= 60:

            recommendation = "Consider"


        else:

            recommendation = "Not Recommended"



        recommendation_reason = evaluation.get(
    "recommendation_reason",
    "AI recommendation generated based on interview performance."
)



        # -----------------------------
        # Database Connection
        # -----------------------------

        conn = get_db_connection()

        cursor = conn.cursor()



        # -----------------------------
        # Save Interview Result
        # -----------------------------

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
    recommendation_reason,
    interview_status,
    completion_reason
)

VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

            """,

            (
                (
    candidate_email,
    transcript,
    evaluation["score"],
    evaluation["technical_score"],
    evaluation["communication_score"],
    evaluation["feedback"],
    recommendation,
    recommendation_reason,
    evaluation.get("interview_status", "Completed"),
    evaluation.get("completion_reason", "")
)
)
        )



        # -----------------------------
        # Update Resume Status
        # -----------------------------

        cursor.execute("""
        UPDATE resumes
        SET 
            interview_status = 'Pending',
            recruiter_status = 'Pending',
            recommendation = NULL,
            score = NULL
        WHERE email = ?
    """, (candidate_email,))



        conn.commit()

        conn.close()



        return jsonify({

            "message": "Interview saved successfully",

            "recommendation": recommendation,

            "score": evaluation.get("score", 0)

        }), 200



    except Exception as e:


        print("SAVE INTERVIEW ERROR:", e)


        return jsonify({

            "error": str(e)

        }), 500
@app.route("/interview-history/<email>", methods=["GET"])
def interview_history(email):

    try:

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                id,
                created_at,
                score,
                technical_score,
                communication_score,
                feedback,
                recommendation,
                recommendation_reason,
                answers,
                interview_status

            FROM interview_results

            WHERE candidate_email = ?

            ORDER BY created_at DESC
        """, (email,))

        rows = cursor.fetchall()

        print("EMAIL:", email)
        print("TOTAL INTERVIEWS:", len(rows))

        interviews = []

        for row in rows:

            interviews.append({

                "id": row[0],

                "date": row[1],

                "score": row[2],

                "technical_score": row[3],

                "communication_score": row[4],

                "feedback": row[5],

                "recommendation": row[6],

                "recommendation_reason": row[7],

                "transcript": row[8],

                "interview_status": row[9],
            })

        conn.close()

        return jsonify({

            "email": email,

            "count": len(interviews),

            "interviews": interviews

        })

    except Exception as e:

        print("INTERVIEW HISTORY ERROR:", e)

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



        email = details.get("email")


        if not email:
            return jsonify({
                "error": "Email not found in resume"
            }), 400



        print("Candidate Email:", email)



        conn = get_db_connection()

        cursor = conn.cursor()



        # Check existing candidate

        cursor.execute(
            """
            SELECT id 
            FROM resumes
            WHERE TRIM(email) = TRIM(?)
            """,
            (email,)
        )


        existing_candidate = cursor.fetchone()



        if existing_candidate:


            # Reset interview status for new attempt

            cursor.execute(
                """
                UPDATE resumes
                SET
                    interview_status = 'Pending',
                    recruiter_status = 'Pending',
                    recommendation = 'Pending'
                WHERE TRIM(email) = TRIM(?)
                """,
                (email,)
            )


            conn.commit()


            print(
                "Existing candidate reset:",
                cursor.rowcount
            )


            conn.close()


            return jsonify({

                "message": "Resume uploaded again. Interview status reset.",

                "data": details

            })




        # Insert new candidate

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
                resume_path,
                interview_status,
                recruiter_status,
                recommendation
            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

            """,

            (
                details.get("name"),
                details.get("email"),
                details.get("phone"),
                ", ".join(details.get("skills", [])),
                details.get("education"),
                details.get("experience"),
                details.get("projects"),
                details.get("certifications"),
                details.get("languages"),
                filepath,
                "Pending",
                "Pending",
                "Pending"
            )

        )


        conn.commit()

        conn.close()



        return jsonify({

            "message": "Resume uploaded successfully",

            "data": details

        })



    except Exception as e:

        print("UPLOAD ERROR:", e)

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

        email = request.args.get("email")

        if not email:
            return jsonify({
                "error": "Email is required"
            }), 400


        conn = get_db_connection()
        cursor = conn.cursor()


        cursor.execute("""
            SELECT

                r.name,
                r.email,
                r.phone,
                r.skills,
                r.education,
                r.experience,
                r.projects,
                r.certifications,
                r.languages,

                r.interview_status,
                r.recruiter_status,

                i.score,
                i.technical_score,
                i.communication_score,

                i.feedback,
                i.recommendation,
                i.recommendation_reason,

                i.completion_reason,

                i.created_at


            FROM resumes r


            LEFT JOIN interview_results i

            ON r.email = i.candidate_email


            AND i.id = (

                SELECT MAX(id)

                FROM interview_results

                WHERE candidate_email = r.email

            )


            WHERE r.email = ?

        """, (email,))


        row = cursor.fetchone()


        conn.close()



        if not row:

            return jsonify({
                "message": "Candidate not found"
            }), 404




        return jsonify({

            "name": row[0],

            "email": row[1],

            "phone": row[2],


            "skills": row[3].split(",") if row[3] else [],

            "education": row[4],

            "experience": row[5],

            "projects": row[6],

            "certifications": row[7],

            "languages": row[8],



            # Current candidate status from resumes table

            "interview_status": row[9] if row[9] else "Pending",

            "recruiter_status": row[10] if row[10] else "Pending",



            # Latest interview result

            "ai_score": row[11] if row[11] is not None else "Pending",

            "technical_score": row[12] if row[12] is not None else 0,

            "communication_score": row[13] if row[13] is not None else 0,


            "feedback": row[14] if row[14] else "Interview not completed.",

            "recommendation": row[15] if row[15] else "Pending",

            "recommendation_reason": row[16] if row[16] else "Not available",


            "completion_reason": row[17] if row[17] else "",


            "interview_date": row[18]

        })


    except Exception as e:

        print("CANDIDATE ERROR:", e)

        return jsonify({

            "error": str(e)

        }), 500
# -----------------------
# Get Interview Results
# -----------------------

@app.route("/interview-results/<email>", methods=["GET"])
def get_interview_results(email):

    try:

        conn = get_db_connection()
        cursor = conn.cursor()


        # Get all interview attempts
        cursor.execute("""
            SELECT
                id,
                score,
                technical_score,
                communication_score,
                feedback,
                recommendation,
                recommendation_reason,
                created_at
            FROM interview_results
            WHERE candidate_email = ?
            ORDER BY id DESC
        """, (email,))


        results = cursor.fetchall()


        attempts = []


        for result in results:

            result_id = result[0]


            # Get transcript/question answers
            cursor.execute("""
    SELECT
        id,
        score,
        technical_score,
        communication_score,
        feedback,
        recommendation,
        recommendation_reason,
        created_at,
        recruiter_status
    FROM interview_results
    WHERE candidate_email = ?
    ORDER BY id DESC
""", (email,))


            answers = cursor.fetchall()


            transcript = []


            for answer in answers:

                transcript.append({

                    "question": answer[0],

                    "candidate_answer": answer[1],

                    "score": answer[2],

                    "feedback": answer[3],

                    "strengths": answer[4],

                    "improvements": answer[5],

                    "ideal_answer": answer[6]

                })



            attempts.append({

                "date": result[7],

                "overall_score": result[1],

                "technical_score": result[2],

                "communication_score": result[3],

                "overall_feedback": result[4],

                "recommendation": result[5],

                "recommendation_reason": result[6],

                "transcript": transcript

            })


        conn.close()


        return jsonify({

            "email": email,

            "attempts": attempts

        })


    except Exception as e:

        return jsonify({

            "error": str(e)

        }), 500


@app.route("/candidate-results/<email>", methods=["GET"])
def get_candidate_results(email):

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
                recruiter_status,
                created_at
            FROM interview_results
            WHERE candidate_email = ?
            ORDER BY id DESC
            LIMIT 1
        """, (email,))

        row = cursor.fetchone()

        conn.close()

        if not row:
            return jsonify({
                "error": "No interview results found"
            }), 404

        return jsonify({

            "email": row[0],

            "overall_score": row[1],

            "technical_score": row[2],

            "communication_score": row[3],

            "overall_feedback": row[4],

            "recommendation": row[5],

            "recommendation_reason": row[6],

            "recruiter_status": row[7] if row[7] else "Pending",

            "date": row[8]

        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


@app.route("/update-candidate-status", methods=["POST"])
def update_candidate_status():

    try:

        data = request.get_json()

        email = data.get("email")
        status = data.get("status")


        print("Received:", email, status)


        conn = get_db_connection()
        cursor = conn.cursor()


        cursor.execute("""
            UPDATE interview_results
            SET recruiter_status = ?
            WHERE id = (
                SELECT id
                FROM interview_results
                WHERE candidate_email = ?
                ORDER BY created_at DESC
                LIMIT 1
            )
        """,
        (
            status,
            email
        ))


        conn.commit()


        print(
            "Updated rows:",
            cursor.rowcount
        )


        conn.close()


        return jsonify({

            "message": "Recruiter status updated",

            "status": status

        })


    except Exception as e:

        print(
            "STATUS UPDATE ERROR:",
            e
        )

        return jsonify({

            "error": str(e)

        }),500
    
    
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