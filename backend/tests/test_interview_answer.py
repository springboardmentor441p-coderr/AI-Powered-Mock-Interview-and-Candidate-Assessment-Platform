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


def test_submit_answer_uses_fallback_when_next_question_generation_fails(
    client,
    monkeypatch,
):
    from app.routers.interview import agent

    start = client.post(
        "/interview/start",
        json={
            "job_role": "Backend Developer",
            "resume": {"name": "John Doe", "skills": ["Python"]},
        },
    )

    def fail_generation(**kwargs):
        raise RuntimeError("Temporary LLM failure")

    monkeypatch.setattr(agent, "generate_next_question", fail_generation)

    answer = client.post(
        "/interview/answer",
        json={
            "session_id": start.json()["session_id"],
            "answer": "I built a FastAPI service and reduced its response time.",
        },
    )

    assert answer.status_code == 200
    assert "specific example" in answer.json()["question"].lower()
