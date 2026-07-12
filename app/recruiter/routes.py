"""
Recruiter dashboard routes.
"""
from flask import Blueprint, flash, redirect, render_template, request, url_for
from flask_login import current_user

from app.analytics.services import AnalyticsService
from app.auth.decorators import login_required_web, recruiter_required
from app.extensions import db
from app.models import InterviewTemplate, Recruiter
from app.utils.constants import DIFFICULTY_LEVELS, DOMAINS, QUESTION_CATEGORIES

recruiter_bp = Blueprint("recruiter", __name__, url_prefix="/recruiter")


@recruiter_bp.route("/dashboard")
@login_required_web
@recruiter_required
def dashboard():
    """Recruiter dashboard with rankings and analytics."""
    data = AnalyticsService.get_recruiter_dashboard()
    recruiter = Recruiter.query.filter_by(user_id=current_user.id).first()
    templates = []
    if recruiter:
        templates = recruiter.interview_templates.order_by(
            InterviewTemplate.created_at.desc()
        ).limit(10).all()
    data["templates"] = templates
    return render_template("recruiter/dashboard.html", **data)


@recruiter_bp.route("/compare", methods=["GET", "POST"])
@login_required_web
@recruiter_required
def compare():
    """Compare candidate performance."""
    comparison = []
    if request.method == "POST":
        candidate_ids = request.form.getlist("candidate_ids", type=int)
        comparison = AnalyticsService.compare_candidates(candidate_ids)
    data = AnalyticsService.get_recruiter_dashboard()
    return render_template(
        "recruiter/compare.html",
        rankings=data["rankings"],
        comparison=comparison,
    )


@recruiter_bp.route("/templates", methods=["GET", "POST"])
@login_required_web
@recruiter_required
def templates():
    """Manage interview templates."""
    recruiter = Recruiter.query.filter_by(user_id=current_user.id).first()
    if not recruiter:
        recruiter = Recruiter(user_id=current_user.id)
        db.session.add(recruiter)
        db.session.commit()

    if request.method == "POST":
        template = InterviewTemplate(
            recruiter_id=recruiter.id,
            name=request.form.get("name", "Template"),
            domain=request.form.get("domain", "Python"),
            category=request.form.get("category", "Technical"),
            difficulty=request.form.get("difficulty", "Medium"),
            question_count=int(request.form.get("question_count", 5)),
            description=request.form.get("description", ""),
        )
        db.session.add(template)
        db.session.commit()
        flash("Interview template created!", "success")
        return redirect(url_for("recruiter.templates"))

    template_list = recruiter.interview_templates.order_by(
        InterviewTemplate.created_at.desc()
    ).all()

    return render_template(
        "recruiter/templates.html",
        templates=template_list,
        domains=DOMAINS,
        categories=QUESTION_CATEGORIES,
        difficulties=DIFFICULTY_LEVELS,
    )
