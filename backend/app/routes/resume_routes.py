from flask import Blueprint, jsonify, request

from app.middleware.role_middleware import role_required
from app.services.resume_service import ResumeService


resume_bp = Blueprint(
    "resume",
    __name__,
    url_prefix="/api/resume"
)


from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

@resume_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_resume():

    try:

        print("\n========== UPLOAD ROUTE START ==========")

        candidate_id = get_jwt_identity()

        print("Candidate ID :", candidate_id)

        if "resume" not in request.files:
            print("No file in request")
            return jsonify({
                "success": False,
                "message": "Resume file is required."
            }), 400

        file = request.files["resume"]

        print("Received File :", file.filename)

        response, status = ResumeService.upload_resume(
            file,
            candidate_id
        )

        print("UPLOAD ROUTE COMPLETED")

        return jsonify(response), status

    except Exception as e:

        import traceback

        traceback.print_exc()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
@resume_bp.route("/my-resumes", methods=["GET"])
@role_required("Candidate")
def my_resumes(current_user):

    response = ResumeService.get_all_resumes(
        current_user.id
    )

    return jsonify(response)



@resume_bp.route("/<int:resume_id>", methods=["GET"])
@role_required("Candidate")
def get_resume(current_user, resume_id):

    response, status = ResumeService.get_resume(
        resume_id,
        current_user.id
    )

    return jsonify(response), status



@resume_bp.route("/<int:resume_id>", methods=["DELETE"])
@role_required("Candidate")
def delete_resume(current_user, resume_id):

    response, status = ResumeService.delete_resume(
        resume_id,
        current_user.id
    )

    return jsonify(response), status