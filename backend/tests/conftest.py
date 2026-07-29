from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def mock_groq():
    """
    Automatically mock Groq LLM calls for tests so tests execute instantly.
    """
    def fake_chat(messages, *, model=None, temperature=0.2, json_output=False):
        if json_output:
            return '{"quality":"good","technical":8,"communication":8,"confidence":8,"problem_solving":8,"needs_followup":false,"reason":"Good response."}'
        return "What strategy did you use to optimize the performance of your backend API?"

    with patch("app.services.interview_agent.chat_with_groq", side_effect=fake_chat), \
         patch("app.services.feedback_generator.chat_with_groq", side_effect=fake_chat), \
         patch("app.services.groq_service.chat_with_groq", side_effect=fake_chat):
        yield
