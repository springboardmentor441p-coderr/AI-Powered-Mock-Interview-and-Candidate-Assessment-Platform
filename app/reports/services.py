"""
PDF report generation using ReportLab.
"""
import os
from datetime import datetime

from flask import current_app
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.extensions import db
from app.models import Interview, Report


class ReportService:
    """Generate downloadable PDF interview reports."""

    @staticmethod
    def generate_interview_report(interview_id: int) -> Report:
        """
        Generate PDF report for completed interview.

        Args:
            interview_id: Interview ID.

        Returns:
            Report record with file path.
        """
        interview = Interview.query.get_or_404(interview_id)
        upload_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "reports")
        os.makedirs(upload_dir, exist_ok=True)

        filename = f"interview_report_{interview_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
        file_path = os.path.join(upload_dir, filename)
        relative_path = os.path.join("reports", filename).replace("\\", "/")

        doc = SimpleDocTemplate(file_path, pagesize=letter)
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontSize=20,
            textColor=colors.HexColor("#1a237e"),
            spaceAfter=20,
        )
        heading_style = ParagraphStyle(
            "CustomHeading",
            parent=styles["Heading2"],
            fontSize=14,
            textColor=colors.HexColor("#283593"),
            spaceBefore=15,
            spaceAfter=8,
        )

        story = []
        app_name = current_app.config.get("APP_NAME", "InterviewIQ")
        story.append(Paragraph(f"{app_name} - Interview Assessment Report", title_style))
        story.append(
            Paragraph(
                f"<b>Candidate:</b> {interview.candidate.full_name or interview.candidate.username}",
                styles["Normal"],
            )
        )
        story.append(Paragraph(f"<b>Interview:</b> {interview.title}", styles["Normal"]))
        story.append(Paragraph(f"<b>Domain:</b> {interview.domain}", styles["Normal"]))
        story.append(Paragraph(f"<b>Date:</b> {interview.completed_at or interview.created_at}", styles["Normal"]))
        story.append(Spacer(1, 0.3 * inch))

        if interview.resume:
            story.append(Paragraph("Resume Summary", heading_style))
            story.append(Paragraph(interview.resume.summary or "N/A", styles["Normal"]))
            story.append(Spacer(1, 0.2 * inch))

        story.append(Paragraph("Interview Q&amp;A", heading_style))
        for question in interview.questions.order_by("order_index"):
            story.append(Paragraph(f"<b>Q:</b> {question.question_text}", styles["Normal"]))
            answer_text = "No answer provided"
            if question.answer:
                answer_text = question.answer.answer_text or "Audio response recorded"
                if question.answer.speech_analysis:
                    answer_text = question.answer.speech_analysis.transcript or answer_text
            story.append(Paragraph(f"<b>A:</b> {answer_text}", styles["Normal"]))
            story.append(Spacer(1, 0.15 * inch))

        if interview.score:
            score = interview.score
            story.append(Paragraph("Scores", heading_style))
            score_data = [
                ["Metric", "Score"],
                ["Technical", f"{score.technical_score:.1f}"],
                ["Communication", f"{score.communication_score:.1f}"],
                ["Confidence", f"{score.confidence_score:.1f}"],
                ["Professionalism", f"{score.professionalism_score:.1f}"],
                ["Overall", f"{score.overall_score:.1f}"],
            ]
            score_table = Table(score_data, colWidths=[3 * inch, 2 * inch])
            score_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a237e")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#e8eaf6")),
                    ]
                )
            )
            story.append(score_table)
            story.append(Spacer(1, 0.2 * inch))

            if score.strengths:
                story.append(Paragraph("Strengths", heading_style))
                story.append(Paragraph(score.strengths.replace("\n", "<br/>"), styles["Normal"]))
            if score.weaknesses:
                story.append(Paragraph("Weaknesses", heading_style))
                story.append(Paragraph(score.weaknesses.replace("\n", "<br/>"), styles["Normal"]))
            if score.suggestions:
                story.append(Paragraph("Suggestions", heading_style))
                story.append(Paragraph(score.suggestions.replace("\n", "<br/>"), styles["Normal"]))
            if score.ai_feedback:
                story.append(Paragraph("AI Feedback", heading_style))
                story.append(Paragraph(score.ai_feedback, styles["Normal"]))

            story.append(Spacer(1, 0.3 * inch))
            rating = "Excellent" if score.overall_score >= 80 else (
                "Good" if score.overall_score >= 60 else "Needs Improvement"
            )
            story.append(
                Paragraph(f"<b>Overall Rating:</b> {rating} ({score.overall_score:.1f}/100)", heading_style)
            )

        doc.build(story)

        existing = Report.query.filter_by(interview_id=interview_id).first()
        if existing:
            report = existing
            report.file_path = relative_path
            report.file_name = filename
            report.generated_at = datetime.utcnow()
        else:
            report = Report(
                interview_id=interview_id,
                file_path=relative_path,
                file_name=filename,
            )
            db.session.add(report)

        db.session.commit()
        return report
