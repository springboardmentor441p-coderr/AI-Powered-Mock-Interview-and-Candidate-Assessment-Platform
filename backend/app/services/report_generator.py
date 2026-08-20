"""Report-generation interfaces for a future assessment report service."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Protocol

from .conversation_memory import ConversationMemory
from .evaluator import EvaluationResult
from .llm_service import LLMRequest
from .prompt_builder import PromptBuilder


@dataclass(frozen=True, slots=True)
class InterviewReport:
    status: str = "pending"
    overall_score: float | None = None
    strengths: list[str] = field(default_factory=list)
    weaknesses: list[str] = field(default_factory=list)
    recommendations: list[str] = field(default_factory=list)
    hiring_decision: str | None = None


class ReportGenerator(Protocol):
    async def generate(
        self,
        memory: ConversationMemory,
        evaluations: list[EvaluationResult],
    ) -> InterviewReport: ...


class PendingReportGenerator:
    """Architecture placeholder; intentionally does not create a candidate report."""

    async def generate(
        self,
        memory: ConversationMemory,
        evaluations: list[EvaluationResult],
    ) -> InterviewReport:
        return InterviewReport(status="not_implemented")


REPORT_SCHEMA = {
    "type": "object",
    "properties": {
        "score": {"type": "integer", "minimum": 0, "maximum": 100},
        "strengths": {"type": "array", "items": {"type": "string"}},
        "improvements": {"type": "array", "items": {"type": "string"}},
        "note": {"type": "string"},
        "communication": {"type": "integer", "minimum": 0, "maximum": 100},
        "technical_knowledge": {"type": "integer", "minimum": 0, "maximum": 100},
        "confidence": {"type": "integer", "minimum": 0, "maximum": 100},
        "problem_solving": {"type": "integer", "minimum": 0, "maximum": 100},
        "recommended_topics": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["score", "strengths", "improvements", "note", "communication", "technical_knowledge", "confidence", "problem_solving", "recommended_topics"],
}


def build_report_request(memory: ConversationMemory) -> LLMRequest:
    return LLMRequest(
        prompt=PromptBuilder().build_final_report(memory),
        temperature=0.2,
        max_tokens=900,
        response_schema=REPORT_SCHEMA,
    )


def parse_report(content: str) -> dict:
    """Validate a provider response before it reaches the existing feedback API."""
    data = json.loads(content)
    required = set(REPORT_SCHEMA["required"])
    if not required.issubset(data) or not all(isinstance(data[key], list) for key in ("strengths", "improvements", "recommended_topics")):
        raise ValueError("LLM returned an invalid interview report.")
    return data


def generate_interview_report_pdf(
    *,
    candidate_name: str,
    candidate_email: str,
    interview_id: int,
    created_at,
    ended_at,
    feedback: dict,
) -> bytes:
    """Render a real, downloadable PDF assessment report from real interview data.

    This intentionally does not invent any score: every value comes from the
    feedback dict produced by resume_analysis.practice_feedback (optionally
    refined by the configured LLM), which is itself derived from persisted
    InterviewQuestionEvaluation rows.
    """
    import io

    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.platypus import ListFlowable, ListItem, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    from .resume_analysis import derive_strengths_and_weaknesses

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("ReportTitle", parent=styles["Title"], textColor=colors.HexColor("#087c50"))
    heading_style = ParagraphStyle("ReportHeading", parent=styles["Heading2"], textColor=colors.HexColor("#101828"), spaceBefore=14, spaceAfter=6)
    body_style = styles["BodyText"]

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.6 * inch, bottomMargin=0.6 * inch, leftMargin=0.7 * inch, rightMargin=0.7 * inch)
    story = [Paragraph("SmartHire AI — Interview Assessment Report", title_style), Spacer(1, 10)]

    meta_rows = [
        ["Candidate", candidate_name or "Candidate"],
        ["Email", candidate_email or "-"],
        ["Interview ID", str(interview_id)],
        ["Date", created_at.strftime("%Y-%m-%d %H:%M UTC") if created_at else "-"],
        ["Completed", ended_at.strftime("%Y-%m-%d %H:%M UTC") if ended_at else "-"],
        ["Questions answered", f"{feedback.get('answered_questions', 0)} / {feedback.get('total_questions', 0)}"],
    ]
    meta_table = Table(meta_rows, colWidths=[1.8 * inch, 4.3 * inch])
    meta_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#344054")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#e5e7eb")),
    ]))
    story += [meta_table, Spacer(1, 14)]

    score = feedback.get("score")
    story.append(Paragraph(f"Overall score: <b>{score if score is not None else 'N/A'} / 100</b>", heading_style))

    category_labels = {
        "communication": "Communication",
        "technical_knowledge": "Technical relevance",
        "confidence": "Confidence",
        "problem_solving": "Problem-solving / completeness",
    }
    category_rows = [["Category", "Score (/100)"]]
    for key, label in category_labels.items():
        value = feedback.get(key)
        category_rows.append([label, str(value) if value is not None else "N/A"])
    category_table = Table(category_rows, colWidths=[3.2 * inch, 2.9 * inch])
    category_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8fff2")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e5e7eb")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story += [Paragraph("Category breakdown", heading_style), category_table]

    strengths, weaknesses = derive_strengths_and_weaknesses(feedback)
    strengths = list(dict.fromkeys([*feedback.get("strengths", []), *strengths]))
    recommendations = list(dict.fromkeys([*feedback.get("improvements", []), *[f"Focus on {t}." for t in feedback.get("recommended_topics", [])]]))

    def bullet_section(title: str, items: list[str]):
        story.append(Paragraph(title, heading_style))
        if items:
            story.append(ListFlowable([ListItem(Paragraph(item, body_style)) for item in items], bulletType="bullet"))
        else:
            story.append(Paragraph("None recorded.", body_style))

    bullet_section("Strengths", strengths)
    bullet_section("Weaknesses", weaknesses)
    bullet_section("Improvement recommendations", recommendations)

    note = feedback.get("note")
    if note:
        story.append(Paragraph("AI feedback", heading_style))
        story.append(Paragraph(note, body_style))

    breakdown = feedback.get("question_breakdown") or []
    if breakdown:
        story.append(Paragraph("Question-by-question summary", heading_style))
        rows = [["#", "Question", "Score"]]
        for index, item in enumerate(breakdown, start=1):
            rows.append([str(index), Paragraph(item.get("question", "")[:120], body_style), str(item.get("score", "-"))])
        table = Table(rows, colWidths=[0.3 * inch, 4.7 * inch, 1.1 * inch])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8fff2")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e5e7eb")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(table)

    story.append(Spacer(1, 16))
    story.append(Paragraph("This is a practice-assessment report generated from a transparent answer-quality rubric. It is intended to support coaching and self-improvement, not as the sole basis for a hiring decision.", ParagraphStyle("Disclaimer", parent=body_style, textColor=colors.HexColor("#667085"), fontSize=8)))

    doc.build(story)
    return buffer.getvalue()
