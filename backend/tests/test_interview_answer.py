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


def test_expired_interview_completes_without_asking_another_question(client):
    from app.routers.interview import agent

    start = client.post(
        "/interview/start",
        json={
            "job_role": "Backend Developer",
            "resume": {"name": "John Doe"},
            "interview_duration": 1,
        },
    )
    session = agent.state.get_session(start.json()["session_id"])
    session.interview_start_time -= timedelta(seconds=61)

    answer = client.post(
        "/interview/answer",
        json={
            "session_id": session.session_id,
            "answer": "This answer arrived after the deadline.",
        },
    )

    assert answer.status_code == 200
    assert answer.json()["completed"] is True
    assert answer.json()["remaining_time"] == 0
    assert session.question_evaluations == []


def test_final_two_minutes_asks_one_closing_question(client):
    from app.routers.interview import agent

    start = client.post(
        "/interview/start",
        json={
            "job_role": "Backend Developer",
            "resume": {"name": "John Doe"},
            "interview_duration": 3,
        },
    )
    session = agent.state.get_session(start.json()["session_id"])
    session.interview_start_time -= timedelta(seconds=91)

    answer = client.post(
        "/interview/answer",
        json={
            "session_id": session.session_id,
            "answer": "I built APIs with FastAPI and measured latency improvements.",
        },
    )

    assert answer.status_code == 200
    assert answer.json()["completed"] is False
    assert answer.json()["current_stage"] == "CLOSING"
    assert "before we conclude" in answer.json()["question"].lower()

    closing_answer = client.post(
        "/interview/answer",
        json={
            "session_id": session.session_id,
            "answer": "My strongest skill is practical backend ownership.",
        },
    )
    assert closing_answer.json()["completed"] is True
from datetime import timedelta
