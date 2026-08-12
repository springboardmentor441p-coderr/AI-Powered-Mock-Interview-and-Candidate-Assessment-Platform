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
    question = answer.json()["question"].lower()
    assert question.startswith("thanks for explaining that")
    assert question.count("?") == 1


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


def test_detailed_scoring_failure_does_not_abort_interview(client, monkeypatch):
    from app.services.scoring_engine import ScoringEngine

    start = client.post(
        "/interview/start",
        json={
            "job_role": "Backend Developer",
            "resume": {"name": "John Doe"},
        },
    )

    monkeypatch.setattr(
        ScoringEngine,
        "evaluate_question",
        lambda **kwargs: (_ for _ in ()).throw(RuntimeError("Analyzer failed")),
    )

    answer = client.post(
        "/interview/answer",
        json={
            "session_id": start.json()["session_id"],
            "answer": "I designed and tested a FastAPI backend service.",
        },
    )

    assert answer.status_code == 200
    assert answer.json()["completed"] is False


def test_generated_question_removes_model_narration():
    from app.services.interview_agent import InterviewAgent

    response = (
        "Based on the current interview state, I'll ask a follow-up question. "
        '"Can you elaborate on the technologies you used?"'
    )

    assert InterviewAgent._clean_generated_question(response) == (
        "Can you elaborate on the technologies you used?"
    )


def test_generated_turn_preserves_grounded_acknowledgement():
    from app.services.interview_agent import InterviewAgent

    response = (
        "That's interesting. You mentioned using FastAPI for the backend. "
        "Why did you choose it over another framework?"
    )

    assert InterviewAgent._clean_generated_question(response) == response


def test_generated_turn_keeps_only_one_question():
    from app.services.interview_agent import InterviewAgent

    response = "Nice work. Was deployment difficult? How did you solve it?"

    assert InterviewAgent._clean_generated_question(response) == (
        "Nice work. Was deployment difficult?"
    )


def test_generated_turn_rejects_truncated_prompt_leakage():
    from app.services.interview_agent import InterviewAgent

    response = (
        "You are Sarah Chen, a Senior Technical Hiring Manager. "
        "You read the complete latest candidate answer before deciding what to ask. "
        "You then ask exactly ONE question about ONE concrete topic"
    )

    assert InterviewAgent._clean_generated_question(response) == ""


def test_generated_turn_strips_prompt_leakage_before_question():
    from app.services.interview_agent import InterviewAgent

    response = (
        "You are Sarah Chen. You start with a brief acknowledgement. "
        "What did you build during your AI internship?"
    )

    assert InterviewAgent._clean_generated_question(response) == (
        "What did you build during your AI internship?"
    )


def test_duplicate_detection_ignores_acknowledgement_wording():
    from app.services.interview_agent import InterviewAgent

    assert InterviewAgent._is_duplicate_question(
        "That makes sense. Why did you choose FastAPI over Flask?",
        ["Interesting. Why did you choose FastAPI over Flask?"],
    )
from datetime import timedelta
