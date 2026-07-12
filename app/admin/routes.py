"""
Admin dashboard routes.
"""
from flask import Blueprint, flash, redirect, render_template, url_for
from flask_login import current_user

from app.analytics.services import AnalyticsService
from app.auth.decorators import admin_required, login_required_web
from app.extensions import db
from app.models import User

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


@admin_bp.route("/dashboard")
@login_required_web
@admin_required
def dashboard():
    """Admin dashboard with platform statistics."""
    data = AnalyticsService.get_admin_dashboard()
    users = User.query.order_by(User.created_at.desc()).limit(50).all()
    data["users"] = users
    return render_template("admin/dashboard.html", **data)


@admin_bp.route("/users/<int:user_id>/toggle", methods=["POST"])
@login_required_web
@admin_required
def toggle_user(user_id: int):
    """Activate or deactivate a user account."""
    user = User.query.get_or_404(user_id)
    if user.id == current_user.id:
        flash("Cannot deactivate your own account.", "danger")
        return redirect(url_for("admin.dashboard"))

    user.is_active = not user.is_active
    db.session.commit()
    status = "activated" if user.is_active else "deactivated"
    flash(f"User {user.username} {status}.", "success")
    return redirect(url_for("admin.dashboard"))
