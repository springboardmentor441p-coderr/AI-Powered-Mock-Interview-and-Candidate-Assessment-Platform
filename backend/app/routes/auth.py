"""
Authentication Routes
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token

from extensions import db
from models.user import User
from models.role import Role

auth_bp = Blueprint("auth", __name__)


# -----------------------------
# Register
# -----------------------------
@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    full_name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")
    role_name = data.get("role", "Candidate")

    if not full_name or not email or not password:
        return jsonify({
            "success": False,
            "message": "All fields are required."
        }), 400

    existing = User.query.filter_by(email=email).first()

    if existing:
        return jsonify({
            "success": False,
            "message": "Email already exists."
        }), 400

    role = Role.query.filter_by(name=role_name).first()

    if not role:
        return jsonify({
            "success": False,
            "message": "Invalid role."
        }), 400

    user = User(
        full_name=full_name,
        email=email,
        role_id=role.id
    )

    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Registration Successful"
    }), 201


# -----------------------------
# Login
# -----------------------------
@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()

    if user is None:
        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    if not user.check_password(password):
        return jsonify({
            "success": False,
            "message": "Incorrect password."
        }), 401

    token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role.name
        }
    )

    return jsonify({
        "success": True,
        "token": token,
        "user": user.to_dict()
    })