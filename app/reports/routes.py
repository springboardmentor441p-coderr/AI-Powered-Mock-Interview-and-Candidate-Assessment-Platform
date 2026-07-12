"""
Report download routes.
"""
import os

from flask import Blueprint, current_app, flash, redirect, send_file, url_for
from flask_login import current_user

from app.auth.decorators import login_required_web
from app.models import Interview
from app.reports.services import ReportService
from app.utils.helpers import get_upload_absolute_path

reports_bp = Blueprint("reports", __name__, url_prefix="/reports")


@reports_bp.route("/download/<int:interview_id>")
@login_required_web
def download(interview_id: int):
    """Download PDF interview report."""
    interview = Interview.query.get_or_404(interview_id)

    if (
        interview.candidate_id != current_user.id
        and not current_user.is_recruiter
        and not current_user.is_admin
    ):
        flash("Access denied.", "danger")
        return redirect(url_for("main.dashboard"))

    report = interview.report
    if not report or not report.file_path:
        report = ReportService.generate_interview_report(interview_id)

    file_path = get_upload_absolute_path(report.file_path)
    if not os.path.isfile(file_path):
        report = ReportService.generate_interview_report(interview_id)
        file_path = get_upload_absolute_path(report.file_path)

    if not os.path.isfile(file_path):
        flash("Report file could not be found. Please try generating it again.", "danger")
        return redirect(url_for("interview.results", interview_id=interview_id))

    return send_file(
        file_path,
        as_attachment=True,
        download_name=report.file_name,
        mimetype="application/pdf",
    )


@reports_bp.route("/generate/<int:interview_id>")
@login_required_web
def generate(interview_id: int):
    """Regenerate and download report."""
    interview = Interview.query.get_or_404(interview_id)

    if (
        interview.candidate_id != current_user.id
        and not current_user.is_recruiter
        and not current_user.is_admin
    ):
        flash("Access denied.", "danger")
        return redirect(url_for("main.dashboard"))

    ReportService.generate_interview_report(interview_id)
    flash("Report generated successfully.", "success")
    return redirect(url_for("reports.download", interview_id=interview_id))
