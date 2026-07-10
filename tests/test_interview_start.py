def test_start_interview(client):
    resume = {
        "name": "John Doe",
        "skills": [
            "Python",
            "FastAPI"
        ],
        "projects": [
            {
                "title": "Resume Parser",
                "description": "Built using FastAPI"
            }
        ]
    }

    response = client.post(
        "/interview/start",
        json={
            "job_role": "Backend Developer",
            "resume": resume,
            "max_questions": 5,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "session_id" in data
    assert "question" in data
    assert len(data["session_id"]) > 0