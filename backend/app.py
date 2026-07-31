"""
SmartHire AI
Main Flask Application
"""

from flask import Flask, jsonify

from config import Config
from extensions import (
    init_extensions,
    db
)

# Import Models
import models

from models.role import Role

# Import Routes
from routes.auth import auth_bp
from routes.report import report_bp

# -----------------------------
# Create Flask App
# -----------------------------
app = Flask(__name__)

# Load Configuration
app.config.from_object(Config)

# Initialize Extensions
init_extensions(app)

# -----------------------------
# Register Blueprints
# -----------------------------

# Authentication Routes
app.register_blueprint(
    auth_bp,
    url_prefix="/api/auth"
)

# Reports Routes
app.register_blueprint(
    report_bp,
    url_prefix="/api/reports"
)

# -----------------------------
# Home Route
# -----------------------------
@app.route("/")
def home():
    """
    API Home
    """
    return jsonify({
        "success": True,
        "message": "Welcome to SmartHire AI Backend",
        "version": "1.0.0"
    })


# -----------------------------
# Health Route
# -----------------------------
@app.route("/health")
def health():
    """
    Health Check
    """
    return jsonify({
        "success": True,
        "status": "running",
        "database": "connected"
    })


# -----------------------------
# Database Initialization
# -----------------------------
with app.app_context():

    db.create_all()

    # Create default roles
    if Role.query.count() == 0:

        db.session.add(
            Role(name="Candidate")
        )

        db.session.add(
            Role(name="Recruiter")
        )

        db.session.add(
            Role(name="Admin")
        )

        db.session.commit()

        print("✅ Default Roles Created")


# -----------------------------
# Run Server
# -----------------------------
if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )