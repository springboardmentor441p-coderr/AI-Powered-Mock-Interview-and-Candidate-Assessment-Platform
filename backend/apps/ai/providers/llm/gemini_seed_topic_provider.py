"""
Gemini-backed seed topic generator for realtime voice interviews.

Takes the full parsed resume (already in the DB) and produces 4-6
resume-grounded interview directives that InterviewOrchestrator
drip-feeds to Ultravox one-by-one via the ask_next_question tool.

Key design choices mirrored from GeminiResumeExtractor:
  - Same SDK (google-genai), same pattern (structured JSON via response_schema)
  - Defensive JSON handling + validation with retry logic
  - Temperature 0.4 (slightly higher than extraction, more creative directives)
"""
import json
import logging

from django.conf import settings

from apps.ai.providers.llm.interfaces import GeneratedSeedTopic, ISeedTopicGenerationProvider
from core.exceptions import ExternalServiceError

logger = logging.getLogger("smarthire")

_MAX_RETRIES = 2
_MIN_TOPICS = 3

_SEED_TOPIC_PROMPT = """\
You are designing a {duration_minute}-minute {interview_type} interview for the candidate below.
The interview is for a role in: {domain}
Difficulty level: {difficulty}

Candidate resume data:
- Summary: {summary}
- Total experience: {experience_years} years
- Technologies: {technologies}
- Skills: {skills}
- Work experience:
{experience_block}
- Projects:
{projects_block}
- Education:
{education_block}

Generate exactly {count} seed topics for a live voice interviewer to follow in order.

RULES (follow strictly):
1. Topic 1 MUST be a warm-up: easy, open-ended, about their overall background and journey.
   Category: "warmup". Difficulty: "easy".

2. Topics 2 through {penultimate} MUST be technical, grounded in SPECIFIC details from this resume.
   Reference the actual company name, project name, or technology from the resume — not generic.
   For any technology listed but NOT mentioned in any project/experience, probe actual depth.
   Category: "technical". Difficulty: "{difficulty}".

3. The LAST topic MUST be behavioral: a real situation they faced, drawn from their experience.
   NOT a hypothetical. Category: "behavioral". Difficulty: "medium".

4. Each topic is an instruction TO the interviewer, not a question TO the candidate.
   Example of bad text: "Tell me about your experience with Django."
   Example of good text: "Explore their Django production experience at {first_company} — \
specifically how they handled database migrations at scale and what the biggest pain point was."

5. expected_topics: list the exact concepts the candidate SHOULD cover in a good answer.
   These are used later for scoring. Be specific (e.g. "zero-downtime migration", "rollback strategy").

6. source_hint: a short string like "from experience[0]" or "from projects[1]" — for debugging only.

7. order: 0-indexed integers 0 through {last_index}.

Return ONLY valid JSON, no preamble, no markdown fences.
"""

_RESPONSE_SCHEMA = {
    "type": "ARRAY",
    "items": {
        "type": "OBJECT",
        "properties": {
            "text": {"type": "STRING"},
            "category": {"type": "STRING"},
            "difficulty": {"type": "STRING"},
            "expected_topics": {"type": "ARRAY", "items": {"type": "STRING"}},
            "order": {"type": "INTEGER"},
            "source_hint": {"type": "STRING"},
        },
        "required": ["text", "category", "difficulty", "expected_topics", "order"],
    },
}


def _format_experience_block(experience: list[dict]) -> str:
    if not experience:
        return "  (none listed)"
    lines = []
    for i, exp in enumerate(experience):
        title = exp.get("title", "Unknown role")
        company = exp.get("company", "Unknown company")
        duration = exp.get("duration", "")
        desc = exp.get("description", "")
        lines.append(f"  [{i}] {title} at {company} ({duration}): {desc}")
    return "\n".join(lines)


def _format_projects_block(projects: list[dict]) -> str:
    if not projects:
        return "  (none listed)"
    lines = []
    for i, proj in enumerate(projects):
        name = proj.get("name", "Unnamed")
        desc = proj.get("description", "")
        techs = ", ".join(proj.get("technologies") or [])
        lines.append(f"  [{i}] {name}: {desc} [Tech: {techs}]")
    return "\n".join(lines)


def _format_education_block(education: list[dict]) -> str:
    if not education:
        return "  (none listed)"
    return "\n".join(
        f"  - {e.get('degree', '')} at {e.get('institution', '')}" for e in education
    )


class GeminiSeedTopicProvider(ISeedTopicGenerationProvider):
    """
    Concrete adapter: Gemini → resume-aware seed topics.

    Activated when AI_SERVICE_PROVIDER=gemini (or explicitly when the
    seed topic service requests it). Falls back gracefully if Gemini
    returns fewer topics than requested — takes the first N ordered by
    `order`, raises if fewer than _MIN_TOPICS come back.
    """

    def generate_seed_topics(
        self,
        *,
        interview_type: str,
        domain: str,
        difficulty: str,
        duration_minutes: int,
        count: int,
        resume_summary: str,
        experience_years: float,
        skills: list[str],
        technologies: list[str],
        experience: list[dict],
        projects: list[dict],
        education: list[dict],
    ) -> list[GeneratedSeedTopic]:
        try:
            from google import genai
            from google.genai import types
        except ImportError as exc:
            raise ExternalServiceError(
                "The 'google-genai' package is not installed. Run `pip install google-genai`."
            ) from exc

        api_key = getattr(settings, "GEMINI_API_KEY", None)
        if not api_key:
            raise ExternalServiceError("GEMINI_API_KEY is not configured.")

        model = getattr(settings, "GEMINI_SEED_TOPIC_MODEL", None) or getattr(
            settings, "GEMINI_RESUME_MODEL", "gemini-2.5-flash"
        )

        first_company = experience[0].get("company", domain) if experience else domain

        prompt = _SEED_TOPIC_PROMPT.format(
            duration_minute=duration_minutes,
            interview_type=interview_type,
            domain=domain,
            difficulty=difficulty,
            summary=resume_summary or "Not provided",
            experience_years=experience_years,
            technologies=", ".join(technologies) or "not specified",
            skills=", ".join(skills) or "not specified",
            experience_block=_format_experience_block(experience),
            projects_block=_format_projects_block(projects),
            education_block=_format_education_block(education),
            count=count,
            penultimate=count - 1,
            last_index=count - 1,
            first_company=first_company,
        )

        client = genai.Client(api_key=api_key)
        last_exc: Exception | None = None

        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=_RESPONSE_SCHEMA,
                        temperature=0.4,
                    ),
                )
                content = response.text
                if not content:
                    raise ExternalServiceError("Gemini returned an empty seed-topic response.")

                payload = json.loads(content)
                if not isinstance(payload, list):
                    raise ExternalServiceError(
                        "Gemini seed-topic response was not a JSON array."
                    )

                # Sort by order, take up to `count`
                payload.sort(key=lambda x: x.get("order", 99))
                payload = payload[:count]

                if len(payload) < _MIN_TOPICS:
                    raise ExternalServiceError(
                        f"Gemini returned only {len(payload)} seed topics (min {_MIN_TOPICS})."
                    )

                topics = []
                for item in payload:
                    topics.append(
                        GeneratedSeedTopic(
                            text=item["text"],
                            category=item.get("category", "technical"),
                            difficulty=item.get("difficulty", difficulty),
                            expected_topics=item.get("expected_topics") or [],
                            order=item.get("order", len(topics)),
                            source_hint=item.get("source_hint", ""),
                        )
                    )

                logger.info(
                    "GeminiSeedTopicProvider: generated %d topics for %s/%s (attempt %d)",
                    len(topics), interview_type, domain, attempt,
                )
                return topics

            except (json.JSONDecodeError, ExternalServiceError) as exc:
                last_exc = exc
                logger.warning(
                    "GeminiSeedTopicProvider: attempt %d/%d failed: %s",
                    attempt, _MAX_RETRIES, exc,
                )
            except Exception as exc:  # noqa: BLE001
                last_exc = exc
                logger.warning(
                    "GeminiSeedTopicProvider: unexpected error on attempt %d/%d: %s",
                    attempt, _MAX_RETRIES, exc,
                )
            finally:
                pass  # client stays open across retries

        client.close()
        raise ExternalServiceError(
            "Seed topic generation via Gemini failed after retries.",
            details={"reason": str(last_exc)},
        )