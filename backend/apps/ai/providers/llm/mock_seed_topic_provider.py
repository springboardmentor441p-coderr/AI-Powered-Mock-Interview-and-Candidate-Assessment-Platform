"""
Mock seed topic provider - used when AI_SERVICE_PROVIDER=mock or in tests.
Produces deterministic placeholder topics that exercise the full pipeline
without needing a real Gemini key.
"""
from apps.ai.providers.llm.interfaces import GeneratedSeedTopic, ISeedTopicGenerationProvider


class MockSeedTopicProvider(ISeedTopicGenerationProvider):
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
        first_tech = technologies[0] if technologies else domain
        first_company = experience[0].get("company", "their previous employer") if experience else "their previous employer"
        first_project = projects[0].get("name", "their main project") if projects else "their main project"

        templates = [
            GeneratedSeedTopic(
                text=(
                    f"Start with a warm-up: ask the candidate to introduce themselves and walk through "
                    f"their journey into {domain}, keeping it conversational and encouraging."
                ),
                category="warmup",
                difficulty="easy",
                expected_topics=["background", "motivation", "career path"],
                order=0,
                source_hint="warmup",
            ),
            GeneratedSeedTopic(
                text=(
                    f"Explore their {first_tech} experience in depth — what's the most complex thing "
                    f"they've built with it, what went wrong, and how did they fix it?"
                ),
                category="technical",
                difficulty=difficulty,
                expected_topics=[first_tech, "debugging", "problem solving", "production experience"],
                order=1,
                source_hint="from technologies[0]",
            ),
            GeneratedSeedTopic(
                text=(
                    f"Dig into the '{first_project}' project on their resume — what was the hardest "
                    f"architectural decision they made, and would they do it differently today?"
                ),
                category="technical",
                difficulty=difficulty,
                expected_topics=["architecture", "trade-offs", "lessons learned", "technical decisions"],
                order=2,
                source_hint="from projects[0]",
            ),
            GeneratedSeedTopic(
                text=(
                    f"Probe their depth on system design: have them walk through how they'd design a "
                    f"scalable component relevant to their work at {first_company}."
                ),
                category="technical",
                difficulty=difficulty,
                expected_topics=["scalability", "system design", "trade-offs", "components"],
                order=3,
                source_hint=f"from experience - {first_company}",
            ),
            GeneratedSeedTopic(
                text=(
                    "Ask about a real situation where they had to deal with a technical disagreement "
                    "with a teammate or manager — what happened, how did they handle it?"
                ),
                category="behavioral",
                difficulty="medium",
                expected_topics=["conflict resolution", "communication", "collaboration", "outcome"],
                order=4,
                source_hint="behavioral",
            ),
        ]

        return templates[:count]