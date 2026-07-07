import json
from typing import Any

from django.conf import settings

from apps.ai.providers.llm.interfaces import FeedbackResult, IFeedbackGenerationProvider
from core.exceptions import ExternalServiceError
from apps.ai.providers.llm.mock_feedback_generator import MockFeedbackGenerator

_PROMPT = """You are an expert interview coach. Based on the following interview
performance data, produce JSON with keys: strengths (list[str]),
weaknesses (list[str]), improvement_suggestions (list[str]),
practice_recommendations (list[str]), learning_resources (list[str]).
Keep each list to 3-5 concise, actionable items. Return ONLY JSON.

Scores (0-100): {scores}
Transcript excerpt: {transcript}
"""


class OpenAIFeedbackGenerationProvider(IFeedbackGenerationProvider):
    def __init__(self):
        self._fallback = MockFeedbackGenerator()

    def generate(self, session_context: dict[str, Any]) -> FeedbackResult:
        try:
            from openai import OpenAI
        except ImportError:
            return self._fallback.generate(session_context)

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        prompt = _PROMPT.format(
            scores=json.dumps(session_context.get("scores", {})),
            transcript=(session_context.get("analysis", {}).get("transcript", "") or "")[:2000],
        )
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
            )
            content = response.choices[0].message.content
            if content is None:
                raise ExternalServiceError("OpenAI returned an empty feedback response.")
            payload = json.loads(content)
        except Exception as exc:  # noqa: BLE001
            raise ExternalServiceError("Feedback generation via OpenAI failed.", details={"reason": str(exc)}) from exc

        return FeedbackResult(
            strengths=payload.get("strengths", []),
            weaknesses=payload.get("weaknesses", []),
            improvement_suggestions=payload.get("improvement_suggestions", []),
            practice_recommendations=payload.get("practice_recommendations", []),
            learning_resources=payload.get("learning_resources", []),
        )
