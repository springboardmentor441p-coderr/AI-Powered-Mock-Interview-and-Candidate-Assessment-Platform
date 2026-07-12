"""
Resume upload routes.
"""
import os

from flask import (
    Blueprint,
    current_app,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    send_file,
    url_for,
)
from flask_login import current_user

from app.auth.decorators import candidate_required, login_required_web
from app.resume.services import ResumeParserService
from app.utils.constants import DOMAINS
from app.utils.helpers import allowed_file, get_upload_absolute_path

resume_bp = Blueprint("resume", __name__, url_prefix="/resume")


@resume_bp.route("/upload", methods=["GET", "POST"])
@login_required_web
@candidate_required
def upload():
    """Resume upload page."""
    if request.method == "POST":
        if "resume_file" not in request.files:
            flash("No file selected.", "danger")
            return redirect(request.url)

        file = request.files["resume_file"]
        if not file.filename:
            flash("No file selected.", "danger")
            return redirect(request.url)

        if not allowed_file(file.filename, {"pdf"}):
            flash("Only PDF files are allowed.", "danger")
            return redirect(request.url)

        domain = request.form.get("domain", "Python")
        try:
            resume = ResumeParserService.process_upload(
                file, current_user.id, domain
            )
            flash(f"Resume '{resume.file_name}' uploaded and parsed successfully!", "success")
            return redirect(url_for("resume.view", resume_id=resume.id))
        except Exception as exc:
            flash(f"Error processing resume: {str(exc)}", "danger")

    resumes = ResumeParserService.get_user_resumes(current_user.id)
    return render_template(
        "resume/upload.html",
        domains=DOMAINS,
        resumes=resumes,
    )


@resume_bp.route("/view/<int:resume_id>")
@login_required_web
def view(resume_id: int):
    """View parsed resume details."""
    from app.models import Resume

    resume = Resume.query.get_or_404(resume_id)
    if resume.user_id != current_user.id and not current_user.is_admin and not current_user.is_recruiter:
        flash("Access denied.", "danger")
        return redirect(url_for("main.dashboard"))

    skills = resume.skills.all()
    return render_template("resume/view.html", resume=resume, skills=skills)


@resume_bp.route("/download/<int:resume_id>")
@login_required_web
def download(resume_id: int):
    """Download uploaded resume PDF."""
    from app.models import Resume

    resume = Resume.query.get_or_404(resume_id)
    if resume.user_id != current_user.id and not current_user.is_admin and not current_user.is_recruiter:
        flash("Access denied.", "danger")
        return redirect(url_for("main.dashboard"))

    file_path = get_upload_absolute_path(resume.file_path)
    if not os.path.isfile(file_path):
        flash("Resume file could not be found on the server.", "danger")
        return redirect(url_for("resume.upload"))

    return send_file(
        file_path,
        as_attachment=True,
        download_name=resume.file_name,
        mimetype="application/pdf",
    )


@resume_bp.route("/api/upload", methods=["POST"])
@login_required_web
@candidate_required
def api_upload():
    """API endpoint for resume upload."""
    if "resume_file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["resume_file"]
    domain = request.form.get("domain", "Python")

    if not allowed_file(file.filename, {"pdf"}):
        return jsonify({"error": "Only PDF files allowed"}), 400

    resume = ResumeParserService.process_upload(file, current_user.id, domain)
    return jsonify(
        {
            "message": "Resume uploaded successfully",
            "resume_id": resume.id,
            "name": resume.name,
            "summary": resume.summary,
            "skills": [s.name for s in resume.skills],
            "missing_skills": resume.missing_skills,
        }
    )
