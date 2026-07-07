import json

from django.conf import settings

from apps.ai.providers.llm.interfaces import GeneratedQuestion, IQuestionGenerationProvider
from core.exceptions import ExternalServiceError

_PROMPT = """Generate {count} {interview_type} interview questions for a candidate
in the domain '{domain}' at '{difficulty}' difficulty. Candidate skills: {skills}.
Return ONLY a JSON array of objects with keys: text, expected_topics (list[str])."""


class OpenAIQuestionGenerationProvider(IQuestionGenerationProvider):
    def generate_questions(
        self,
        interview_type: str,
        domain: str,
        difficulty: str,
        count: int,
        candidate_skills: list[str] | None = None,
    ) -> list[GeneratedQuestion]:
        try:
            from openai import OpenAI
        except ImportError as exc:
            raise ExternalServiceError("The 'openai' package is not installed.") from exc

        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        prompt = _PROMPT.format(
            count=count,
            interview_type=interview_type,
            domain=domain,
            difficulty=difficulty,
            skills=", ".join(candidate_skills or []) or "general",
        )
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
            )
            content = response.choices[0].message.content
            if content is None:
                raise ExternalServiceError("OpenAI returned an empty question-generation response.")
            payload = json.loads(content)
        except Exception as exc:  # noqa: BLE001
            raise ExternalServiceError("Question generation via OpenAI failed.", details={"reason": str(exc)}) from exc

        return [
            GeneratedQuestion(
                text=item["text"],
                category=interview_type,
                difficulty=difficulty,
                expected_topics=item.get("expected_topics", []),
            )
            for item in payload
        ]
