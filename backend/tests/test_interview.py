from unittest.mock import patch
from app.services.interview_service import InterviewService


def test_interview_flow_end_to_end(client, auth_headers):
    # 1. Upload mock resume first to build profile
    resume_text = "John Doe\njohn.doe@example.com\nPython Developer\nSkills: Python, FastAPI, SQL"
    with patch("app.services.resume_service.extract_text", return_value=resume_text):
        file_payload = {"file": ("resume.pdf", b"mock resume content", "application/pdf")}
        response = client.post(
            "/api/v1/resume/upload",
            files=file_payload,
            headers=auth_headers
        )
        assert response.status_code == 201

    # 2. Start Interview Session
    start_payload = {
        "job_role": "Python Developer",
        "difficulty": "Intermediate",
        "interview_type": "Technical"
    }
    start_response = client.post(
        "/api/v1/interview/start",
        json=start_payload,
        headers=auth_headers
    )
    assert start_response.status_code == 201
    start_data = start_response.json()
    session_id = start_data["session_id"]
    q1_id = start_data["question_id"]
    assert start_data["current_round"] == 1
    assert "question_text" in start_data

    # 3. Submit Answers for Round 1
    # Round 1 is configured to have ROUND_1_LIMIT = 3 questions (lines 13 in interview_service.py)
    # We will submit answers for 3 questions
    current_q_id = q1_id
    for q_num in range(1, 4):
        submit_payload = {
            "session_id": session_id,
            "question_id": current_q_id,
            "answer_text": f"This is my long technical answer for question {q_num} that explains how FastAPI uses ASGI and Pydantic validation."
        }
        submit_response = client.post(
            "/api/v1/interview/submit-answer",
            json=submit_payload,
            headers=auth_headers
        )
        assert submit_response.status_code == 200
        submit_data = submit_response.json()
        assert "evaluation" in submit_data
        
        # Verify next question updates unless we transition
        if q_num < 3:
            assert submit_data["next_action"] == "NEXT_QUESTION"
            assert submit_data["next_question_id"] is not None
            current_q_id = submit_data["next_question_id"]
        else:
            # At 3rd question, we transition
            # Since our answers are long and contain keywords, evaluation scores will be high (>= 5.5 passing threshold)
            # Therefore it should transition to Round 2
            assert submit_data["next_action"] in ("PROCEED_TO_ROUND_2", "GENERATE_REPORT")
            if submit_data["next_action"] == "PROCEED_TO_ROUND_2":
                assert submit_data["next_question_id"] is not None
                current_q_id = submit_data["next_question_id"]

    # 4. Submit Answers for Round 2 (if we passed to Round 2)
    # Let's check status of the session in DB
    history_response = client.get("/api/v1/interview/history", headers=auth_headers)
    assert history_response.status_code == 200
    history_data = history_response.json()
    session_record = next(s for s in history_data if s["id"] == session_id)
    
    if session_record["current_round"] == 2:
        # In Round 2, let's complete the remaining questions.
        # Step limit in Round 2 is 5 (total_r2_steps >= 5 triggers report generation)
        for step in range(1, 6):
            submit_payload = {
                "session_id": session_id,
                "question_id": current_q_id,
                "answer_text": "This is a detailed response explaining the database sharding, connection pooling, and multi-stage Docker builds."
            }
            submit_response = client.post(
                "/api/v1/interview/submit-answer",
                json=submit_payload,
                headers=auth_headers
            )
            assert submit_response.status_code == 200
            submit_data = submit_response.json()
            if submit_data["next_action"] == "GENERATE_REPORT":
                break
            else:
                assert submit_data["next_question_id"] is not None
                current_q_id = submit_data["next_question_id"]

    # 5. Verify Report Generation
    report_response = client.get(f"/api/v1/interview/report/{session_id}", headers=auth_headers)
    assert report_response.status_code == 200
    report_data = report_response.json()
    assert report_data["session_id"] == session_id
    assert report_data["overall_score"] > 0
    assert len(report_data["strengths"]) > 0
    assert len(report_data["weaknesses"]) > 0
    assert len(report_data["learning_path"]) > 0


def test_interview_pause_resume_control(client, auth_headers):
    # Start Session
    start_payload = {
        "job_role": "AI Engineer",
        "difficulty": "Intermediate",
        "interview_type": "Technical"
    }
    start_response = client.post(
        "/api/v1/interview/start",
        json=start_payload,
        headers=auth_headers
    )
    session_id = start_response.json()["session_id"]

    # Pause Interview
    response = client.post("/api/v1/interview/control", json={
        "session_id": session_id,
        "action": "pause"
    }, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["session_status"] == "PAUSED"

    # Resume Interview
    response = client.post("/api/v1/interview/control", json={
        "session_id": session_id,
        "action": "resume"
    }, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["session_status"] == "IN_PROGRESS"

    # Stop Interview
    response = client.post("/api/v1/interview/control", json={
        "session_id": session_id,
        "action": "stop"
    }, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["session_status"] == "TERMINATED"
