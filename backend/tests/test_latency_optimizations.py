from app.services.prompt_builder import build_prompt


def test_next_question_prompt_keeps_only_recent_conversation():
    conversation = [
        {"role": "user", "content": f"turn-{index}"}
        for index in range(10)
    ]
    messages = build_prompt(
        interview_type="technical",
        job_context={"job_title": "Backend Developer"},
        resume={
            "name": "Candidate",
            "email": "private@example.com",
            "skills": ["Python"],
        },
        conversation_history=conversation,
        interview_state={"questions_asked": [], "candidate_answer": "Latest answer"},
    )

    prompt = messages[1]["content"]
    assert "turn-3" not in prompt
    assert "turn-4" in prompt
    assert "private@example.com" not in prompt
    assert '"skills":["Python"]' in prompt


def test_groq_client_is_reused_and_can_be_closed(monkeypatch):
    from app.services import groq_service

    class FakeClient:
        def __init__(self, **kwargs):
            self.closed = False

        def close(self):
            self.closed = True

    groq_service.close_groq_client()
    monkeypatch.setattr(groq_service.httpx, "Client", FakeClient)

    first = groq_service.get_groq_client()
    second = groq_service.get_groq_client()
    assert first is second

    groq_service.close_groq_client()
    assert first.closed is True
