from flask import Blueprint
from flask import jsonify

main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def home():

    return jsonify(
        {
            "project": "SmartHire AI",
            "version": "1.0",
            "status": "Running Successfully"
        }
    )


@main_bp.route("/health")
def health():

    return jsonify(
        {
            "status": "OK"
        }
    )