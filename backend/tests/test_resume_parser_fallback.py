from app.services.groq_service import GroqTimeoutError
from app.services import resume_parser


def test_parse_resume_uses_fallback_when_groq_times_out(monkeypatch):
    resume_text = """
Mahir Thakur
mahir@example.com
https://github.com/mahir

SKILLS
Python FastAPI React Docker PostgreSQL

PROJECTS
SmartHire AI mock interview platform using FastAPI and React.
"""

    monkeypatch.setattr(
        resume_parser,
        "extract_resume_text",
        lambda filename, file_bytes: resume_text,
    )
    monkeypatch.setattr(
        resume_parser,
        "query_groq_for_resume_json",
        lambda resume_text: (_ for _ in ()).throw(GroqTimeoutError("timeout")),
    )

    parsed = resume_parser.parse_resume("resume.pdf", b"fake pdf bytes")

    assert parsed["parser_source"] == "fallback"
    assert parsed["name"] == "Mahir Thakur"
    assert parsed["email"] == "mahir@example.com"
    assert "Python" in parsed["skills"]
    assert parsed["projects"]
