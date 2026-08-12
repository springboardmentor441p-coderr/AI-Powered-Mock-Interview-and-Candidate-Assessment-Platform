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


def test_answers_are_evaluated_only_when_report_is_generated(client, monkeypatch):
    from app.routers.interview import agent

    calls = []
    original = agent.evaluate_answers_batch

    def track_evaluation(pending_answers):
        calls.append(pending_answers)
        return original(pending_answers)

    monkeypatch.setattr(
        type(agent),
        "evaluate_answers_batch",
        staticmethod(track_evaluation),
    )

    start = client.post(
        "/interview/start",
        json={
            "job_role": "Backend Developer",
            "resume": {"name": "John Doe", "skills": ["Python"]},
            "max_questions": 2,
        },
    )
    session_id = start.json()["session_id"]

    answer = client.post(
        "/interview/answer",
        json={"session_id": session_id, "answer": "I build APIs with FastAPI."},
    )
    assert answer.status_code == 200
    assert calls == []

    report = client.post("/interview/end", json={"session_id": session_id})
    assert report.status_code == 200
    assert len(calls) == 1
    assert len(report.json()["question_wise_evaluation"]) == 1

    # Re-reading a report must not score the same transcript twice.
    second_report = client.post("/interview/end", json={"session_id": session_id})
    assert second_report.status_code == 200
    assert len(calls) == 1
