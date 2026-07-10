def test_submit_answer(client):
    resume = {
        "name": "John Doe",
        "skills": ["Python"],
        "projects": [],
    }

    start = client.post(
        "/interview/start",
        json={
            "job_role": "Backend Developer",
            "resume": resume,
        },
    )

    session_id = start.json()["session_id"]

    answer = client.post(
        "/interview/answer",
        json={
            "session_id": session_id,
            "answer": "I am a backend developer with FastAPI experience.",
        },
    )

    assert answer.status_code == 200

    body = answer.json()

    assert "question" in body
    assert "completed" in body