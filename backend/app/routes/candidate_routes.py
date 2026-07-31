from flask import Blueprint, jsonify

from flask_jwt_extended import get_jwt_identity

from app.middleware.role_middleware import role_required
from app.services.candidate_service import CandidateService


candidate_bp = Blueprint(
    "candidate",
    __name__,
    url_prefix="/api/candidate"
)


@candidate_bp.route("/dashboard", methods=["GET"])
@role_required("Candidate")
def dashboard(current_user):

    response = CandidateService.get_dashboard(
        current_user.id
    )

    return jsonify(response)


@candidate_bp.route("/profile", methods=["GET"])
@role_required("Candidate")
def profile(current_user):

    response = CandidateService.get_profile(
        current_user.id
    )

    return jsonify(response)


@candidate_bp.route("/cards", methods=["GET"])
@role_required("Candidate")
def dashboard_cards(current_user):

    response = CandidateService.get_dashboard_cards(
        current_user.id
    )

    return jsonify(response)
@candidate_bp.route("/analysis", methods=["GET"])
@role_required("Candidate")
def ai_analysis(current_user):

    response = CandidateService.get_ai_analysis(
        current_user.id
    )

    return jsonify(response)


@candidate_bp.route("/activity", methods=["GET"])
@role_required("Candidate")
def recent_activity(current_user):

    response = CandidateService.get_recent_activity(
        current_user.id
    )

    return jsonify(response)