"""
Interview routes - creation, session, recording, evaluation.
"""
import json

from flask import (
    Blueprint,
    flash,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
)
from flask_login import current_user

from app.auth.decorators import candidate_required, login_required_web
from app.extensions import csrf
from app.interview.services import InterviewService
from app.models import Question
from app.reports.services import ReportService
from app.resume.services import ResumeParserService
from app.utils.constants import (
    DEFAULT_QUESTION_COUNT,
    DIFFICULTY_LEVELS,
    DOMAINS,
    INTERVIEW_CANCELLED,
    INTERVIEWER_NAME,
    INTERVIEWER_ROLE,
    QUESTION_CATEGORIES,
    RESUME_REQUIRED_MESSAGE,
    RESUME_UPLOAD_SUCCESS,
)
from app.utils.helpers import allowed_file

interview_bp = Blueprint("interview", __name__, url_prefix="/interview")


@interview_bp.route("/create", methods=["GET", "POST"])
@login_required_web
@candidate_required
def create():
    """Create new AI interview."""
    if request.method == "POST":
        title = request.form.get("title", "Live Interview")
        domain = request.form.get("domain", "Python")
        category = request.form.get("category", "Technical")
        difficulty = request.form.get("difficulty", "Medium")
        question_count = int(request.form.get("question_count", DEFAULT_QUESTION_COUNT))
        resume_id = request.form.get("resume_id", type=int)
        resume_file = request.files.get("resume_file")

        resolved_resume_id = resume_id

        if resume_file and resume_file.filename:
            if not allowed_file(resume_file.filename, {"pdf"}):
                flash("Only PDF resume files are allowed.", "danger")
                return redirect(request.url)
            try:
                resume = ResumeParserService.process_upload(
                    resume_file, current_user.id, domain
                )
                resolved_resume_id = resume.id
                flash(RESUME_UPLOAD_SUCCESS, "success")
            except Exception as exc:
                flash(f"Resume upload failed: {str(exc)}", "danger")
                return redirect(request.url)
        elif not resolved_resume_id:
            existing = ResumeParserService.get_primary_resume(current_user.id)
            if existing:
                resolved_resume_id = existing.id

        if not resolved_resume_id:
            flash(RESUME_REQUIRED_MESSAGE, "danger")
            return redirect(request.url)

        interview = InterviewService.create_interview(
            candidate_id=current_user.id,
            title=title,
            domain=domain,
            category=category,
            difficulty=difficulty,
            question_count=question_count,
            resume_id=resolved_resume_id,
        )
        flash("Interview created! Your live session is ready.", "success")
        return redirect(url_for("interview.session", interview_id=interview.id))

    resumes = ResumeParserService.get_user_resumes(current_user.id)
    return render_template(
        "interview/create.html",
        domains=DOMAINS,
        categories=QUESTION_CATEGORIES,
        difficulties=DIFFICULTY_LEVELS,
        resumes=resumes,
    )


@interview_bp.route("/session/<int:interview_id>")
@login_required_web
@candidate_required
def session(interview_id: int):
    """Live interview session with webcam and microphone."""
    interview = InterviewService.get_interview_detail(interview_id)
    if not interview or interview.candidate_id != current_user.id:
        flash("Interview not found.", "danger")
        return redirect(url_for("candidate.dashboard"))

    if interview.status == INTERVIEW_CANCELLED:
        flash(
            "This interview was cancelled. You can review the full stored record below.",
            "warning",
        )
        return redirect(url_for("interview.results", interview_id=interview.id))

    if interview.status == "scheduled":
        InterviewService.start_interview(interview_id)

    session_state = InterviewService.get_session_state(interview_id)
    resume = interview.resume
    resume_skills = []
    if resume:
        resume_skills = [skill.name for skill in resume.skills.all()]

    return render_template(
        "interview/session.html",
        interview=interview,
        session_state=session_state,
        interviewer_name=INTERVIEWER_NAME,
        interviewer_role=INTERVIEWER_ROLE,
        resume=resume,
        resume_skills=resume_skills,
    )


@interview_bp.route("/api/session-state/<int:interview_id>")
@login_required_web
@candidate_required
def session_state(interview_id: int):
    """Get live conversational session state."""
    interview = InterviewService.get_interview_detail(interview_id)
    if not interview or interview.candidate_id != current_user.id:
        return jsonify({"error": "Interview not found"}), 404

    return jsonify(InterviewService.get_session_state(interview_id))


@interview_bp.route("/api/submit-response", methods=["POST"])
@login_required_web
@candidate_required
@csrf.exempt
def submit_response():
    """Save candidate response and receive next interviewer message."""
    question_id = request.form.get("question_id", type=int)
    answer_text = request.form.get("answer_text", "")
    duration = request.form.get("duration_seconds", 0, type=int)
    audio_file = request.files.get("audio_file")

    frame_data = None
    frame_json = request.form.get("frame_data")
    if frame_json:
        try:
            frame_data = json.loads(frame_json)
        except json.JSONDecodeError:
            frame_data = None

    if not question_id:
        return jsonify({"error": "question_id is required"}), 400

    question_row = Question.query.get_or_404(question_id)
    interview = InterviewService.get_interview_detail(question_row.interview_id)
    if not interview or interview.candidate_id != current_user.id:
        return jsonify({"error": "Access denied"}), 403

    result = InterviewService.submit_response(
        question_id=question_id,
        answer_text=answer_text,
        audio_file=audio_file,
        duration_seconds=duration,
        frame_data=frame_data,
    )

    if result.get("is_cancelled"):
        result["redirect_url"] = url_for(
            "interview.results", interview_id=interview.id
        )

    return jsonify(result)


@interview_bp.route("/api/save-answer", methods=["POST"])
@login_required_web
@candidate_required
@csrf.exempt
def save_answer():
    """Save answer with audio and emotion data."""
    question_id = request.form.get("question_id", type=int)
    answer_text = request.form.get("answer_text", "")
    duration = request.form.get("duration_seconds", 60, type=int)
    audio_file = request.files.get("audio_file")

    frame_data = None
    frame_json = request.form.get("frame_data")
    if frame_json:
        try:
            frame_data = json.loads(frame_json)
        except json.JSONDecodeError:
            frame_data = None

    answer = InterviewService.save_answer(
        question_id=question_id,
        answer_text=answer_text,
        audio_file=audio_file,
        duration_seconds=duration,
        frame_data=frame_data,
    )

    speech = answer.speech_analysis
    emotion = answer.emotion_analysis

    return jsonify(
        {
            "message": "Answer saved",
            "answer_id": answer.id,
            "transcript": speech.transcript if speech else answer_text,
            "communication_score": speech.communication_score if speech else 0,
            "dominant_emotion": emotion.dominant_emotion if emotion else "Neutral",
            "confidence_score": emotion.confidence_score if emotion else 0,
        }
    )


@interview_bp.route("/api/complete/<int:interview_id>", methods=["POST"])
@login_required_web
@candidate_required
@csrf.exempt
def complete(interview_id: int):
    """Complete interview and trigger evaluation."""
    video_file = request.files.get("video_file")
    audio_file = request.files.get("audio_file")

    score = InterviewService.complete_interview(
        interview_id, video_file=video_file, audio_file=audio_file
    )
    ReportService.generate_interview_report(interview_id)

    return jsonify(
        {
            "message": "Interview completed",
            "overall_score": score.overall_score,
            "technical_score": score.technical_score,
            "communication_score": score.communication_score,
            "redirect_url": url_for("interview.results", interview_id=interview_id),
        }
    )


@interview_bp.route("/results/<int:interview_id>")
@login_required_web
def results(interview_id: int):
    """View full stored interview record (shared by candidate and recruiter)."""
    interview = InterviewService.get_interview_detail(interview_id)
    if not interview:
        flash("Interview not found.", "danger")
        return redirect(url_for("main.dashboard"))

    if (
        interview.candidate_id != current_user.id
        and not current_user.is_recruiter
        and not current_user.is_admin
    ):
        flash("Access denied.", "danger")
        return redirect(url_for("main.dashboard"))

    record = InterviewService.build_interview_record(interview)
    return render_template(
        "interview/results.html",
        interview=interview,
        record=record,
        questions=record["questions"],
        turns=record["turns"],
        score=record["score"],
        report=record["report"],
        resume=record["resume"],
        resume_skills=record["resume_skills"],
        candidate_name=record["candidate_name"],
        candidate_email=record["candidate_email"],
        cancellation_reason=record["cancellation_reason"],
        interviewer_name=INTERVIEWER_NAME,
        interviewer_role=INTERVIEWER_ROLE,
        is_recruiter_view=current_user.is_recruiter or current_user.is_admin,
    )


@interview_bp.route("/history")
@login_required_web
@candidate_required
def history():
    """Candidate interview history."""
    interviews = InterviewService.get_candidate_interviews(current_user.id)
    return render_template("interview/history.html", interviews=interviews)
