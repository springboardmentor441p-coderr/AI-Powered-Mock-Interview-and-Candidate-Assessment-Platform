"""
Candidate dashboard routes.
"""
from flask import Blueprint, render_template, send_from_directory, current_app
from flask_login import current_user

from app.analytics.services import AnalyticsService
from app.auth.decorators import candidate_required, login_required_web

candidate_bp = Blueprint("candidate", __name__, url_prefix="/candidate")


@candidate_bp.route("/dashboard")
@login_required_web
@candidate_required
def dashboard():
    """Candidate dashboard with resume, interviews, and charts."""
    data = AnalyticsService.get_candidate_dashboard(current_user.id)
    return render_template("candidate/dashboard.html", **data)
