def test_generate_feedback(client):
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
            "max_questions": 1,
        },
    )

    session_id = start.json()["session_id"]

    client.post(
        "/interview/answer",
        json={
            "session_id": session_id,
            "answer": "I enjoy building backend APIs.",
        },
    )

    feedback = client.post(
        "/interview/end",
        json={
            "session_id": session_id,
        },
    )

    assert feedback.status_code == 200

    data = feedback.json()

    assert "overall_score" in data
    assert "strengths" in data
    assert "weaknesses" in data


def test_ending_without_answers_returns_not_evaluated_report(client):
    start = client.post(
        "/interview/start",
        json={
            "job_role": "Backend Developer",
            "resume": {"name": "John Doe", "skills": ["Python"]},
        },
    )

    report = client.post(
        "/interview/end",
        json={"session_id": start.json()["session_id"]},
    )

    assert report.status_code == 200
    body = report.json()
    assert body["overall_score"] == 0.0
    assert body["performance_rating"] == "Not Evaluated"
    assert body["question_wise_evaluation"] == []
    assert body["analytics"]["answered_questions"] == 0
