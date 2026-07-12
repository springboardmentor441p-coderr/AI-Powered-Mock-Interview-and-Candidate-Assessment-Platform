"""
Main application routes.
"""
from flask import Blueprint, redirect, render_template, url_for
from flask_login import current_user

main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def index():
    """Landing page."""
    return render_template("index.html")


@main_bp.route("/dashboard")
def dashboard():
    """Redirect to role-specific dashboard."""
    if not current_user.is_authenticated:
        return redirect(url_for("auth.login"))

    if current_user.is_admin:
        return redirect(url_for("admin.dashboard"))
    if current_user.is_recruiter:
        return redirect(url_for("recruiter.dashboard"))
    return redirect(url_for("candidate.dashboard"))


@main_bp.route("/about")
def about():
    """About page."""
    return render_template("about.html")
