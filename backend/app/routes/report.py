"""
SmartHire AI
Report Routes
"""

from flask import Blueprint, jsonify

report_bp = Blueprint(
    "report_bp",
    __name__
)


@report_bp.route("/latest", methods=["GET"])
def latest_report():

    return jsonify({
        "overallScore": 84,
        "technicalScore": 88,
        "communicationScore": 80,
        "problemSolvingScore": 85,
        "confidenceScore": 82,

        "strengths": [
            "Strong technical fundamentals",
            "Good problem solving",
            "Clear communication skills"
        ],

        "weaknesses": [
            "Improve confidence",
            "Reduce hesitation during answers"
        ],

        "feedback": [
            "Good understanding of technical concepts.",
            "Communication quality is above average.",
            "Continue practicing mock interviews."
        ],

        "recommendations": [
            "Practice behavioral interview questions",
            "Improve confidence level",
            "Take more timed assessments"
        ]
    })


@report_bp.route("/history", methods=["GET"])
def interview_history():

    return jsonify([
        {
            "date": "2026-07-01",
            "role": "Python Developer",
            "score": 82,
            "status": "Completed"
        },
        {
            "date": "2026-07-10",
            "role": "Backend Developer",
            "score": 84,
            "status": "Completed"
        },
        {
            "date": "2026-07-15",
            "role": "Software Engineer",
            "score": 86,
            "status": "Completed"
        }
    ])