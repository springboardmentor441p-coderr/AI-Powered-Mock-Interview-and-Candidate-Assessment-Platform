from unittest.mock import patch
from app.utils.resume_parser import parse_resume


def test_resume_upload_success(client, auth_headers):
    # Mock extract_text to return sample candidate details
    sample_text = """
    John Doe
    john.doe@example.com
    123-456-7890
    Education:
    Bachelor of Science in Computer Science, State University, 2020

    Experience:
    Software Engineer, Tech Corp (Jan 2021 - Present)
    Built web applications using Python, FastAPI, and PostgreSQL.
    Developed frontend using React and TypeScript.
    Deployed models on AWS with Docker.

    Projects:
    E-Commerce Site
    Online platform with React, Node.js and Redis.

    Certifications:
    AWS Certified Developer

    Skills:
    Python, React, TypeScript, FastAPI, PostgreSQL, AWS, Docker, Redis
    """
    
    with patch("app.services.resume_service.extract_text", return_value=sample_text):
        file_payload = {"file": ("resume.pdf", b"mock pdf content", "application/pdf")}
        response = client.post(
            "/api/v1/resume/upload",
            files=file_payload,
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["filename"] == "resume.pdf"
        assert data["candidate_name"] == "John Doe"
        assert data["candidate_email"] == "john.doe@example.com"
        assert "Python" in data["skills"]


def test_resume_upload_invalid_type_fails(client, auth_headers):
    file_payload = {"file": ("resume.txt", b"plain text content", "text/plain")}
    response = client.post(
        "/api/v1/resume/upload",
        files=file_payload,
        headers=auth_headers
    )
    assert response.status_code == 400
    assert "unsupported file type" in response.json()["detail"].lower()


def test_get_latest_resume_success(client, auth_headers):
    # Retrieve latest when none uploaded
    response = client.get("/api/v1/resume/latest", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() is None


def test_parse_resume_logic():
    text = "Jane Doe\njane.doe@example.com\nPython, React, AWS, Docker"
    parsed = parse_resume(text)
    assert parsed["candidate_name"] == "Jane Doe"
    assert parsed["candidate_email"] == "jane.doe@example.com"
    assert "Python" in parsed["programming_languages"]
    assert "React" in parsed["frameworks"]
