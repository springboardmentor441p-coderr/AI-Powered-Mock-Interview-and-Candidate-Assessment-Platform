from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pymongo.database import Database
import pymongo
from bson import ObjectId
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

from backend.database import get_db
from backend.models.session import SessionReport, InterviewSession
from backend.routers.auth import get_current_user
from backend.models.user import User

router = APIRouter()

@router.get("/{session_id}/download")
def download_report(
    session_id: str,
    db: Database = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Fetch report
    r_doc = db.session_reports.find_one({"session_id": session_id})
    if not r_doc:
        raise HTTPException(status_code=404, detail="Report not found")
        
    s_doc = db.interview_sessions.find_one({"_id": ObjectId(session_id)})
    if not s_doc:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Security check (ensure only user who took the interview can download)
    if s_doc.get("user_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to download this report")

    report = SessionReport.from_mongo(r_doc)
    
    # Generate PDF
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Title
    p.setFont("Helvetica-Bold", 20)
    p.drawString(50, height - 50, f"Interview Report: {s_doc.get('interview_type')} ({s_doc.get('domain')})")

    # Overall Score
    p.setFont("Helvetica", 14)
    p.drawString(50, height - 90, f"Overall Score: {report.overall_score}/100")
    p.drawString(50, height - 110, f"Rating: {report.rating}")

    # Sub Scores
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, height - 150, "Detailed Scores:")
    p.setFont("Helvetica", 12)
    p.drawString(70, height - 170, f"Communication: {report.communication_score}")
    p.drawString(70, height - 190, f"Confidence: {report.confidence_score}")
    p.drawString(70, height - 210, f"Technical: {report.technical_score}")
    p.drawString(70, height - 230, f"Professionalism: {report.professionalism_score}")

    # Feedback
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, height - 270, "Strengths:")
    p.setFont("Helvetica", 12)
    
    textobject = p.beginText(70, height - 290)
    textobject.setFont("Helvetica", 12)
    textobject.textLines(report.strengths or "N/A")
    p.drawText(textobject)
    
    y = textobject.getY() - 30

    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, y, "Weaknesses:")
    y -= 20
    textobject = p.beginText(70, y)
    textobject.setFont("Helvetica", 12)
    textobject.textLines(report.weaknesses or "N/A")
    p.drawText(textobject)
    
    y = textobject.getY() - 30

    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, y, "Suggestions for Improvement:")
    y -= 20
    textobject = p.beginText(70, y)
    textobject.setFont("Helvetica", 12)
    textobject.textLines(report.suggestions or "N/A")
    p.drawText(textobject)

    p.showPage()
    p.save()

    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    headers = {
        'Content-Disposition': f'attachment; filename="Report_{session_id}.pdf"'
    }
    
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
