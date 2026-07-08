"""
LLM AI ports: every capability backed by a general-purpose language
model (question generation, resume extraction, feedback generation,
seed topic generation).
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class GeneratedQuestion:
    text: str
    category: str
    difficulty: str
    expected_topics: list[str] = field(default_factory=list)


@dataclass
class GeneratedSeedTopic:
    """
    A resume-grounded interview directive produced by the seed topic generator.
    Unlike GeneratedQuestion (used for scripted sessions), this is NOT a
    question the AI reads verbatim — it's an instruction the orchestrator
    feeds to Ultravox so it can ask in its own words.
    """
    text: str                           # directive text
    category: str                       # "technical" | "behavioral" | "warmup"
    difficulty: str                     # "easy" | "medium" | "hard"
    expected_topics: list[str] = field(default_factory=list)   # concepts for scoring
    order: int = 0
    source_hint: str = ""               # debug: "from experience[0]", "from projects[1]"


@dataclass
class ResumeExtractionResult:
    skills: list[str]
    technologies: list[str]
    experience_years: float
    education: list[dict]
    summary: str
    raw_text: str
    experience: list[dict] = field(default_factory=list)
    projects: list[dict] = field(default_factory=list)


@dataclass
class FeedbackResult:
    strengths: list[str]
    weaknesses: list[str]
    improvement_suggestions: list[str]
    practice_recommendations: list[str]
    learning_resources: list[str]


class IQuestionGenerationProvider(ABC):
    @abstractmethod
    def generate_questions(
        self,
        interview_type: str,
        domain: str,
        difficulty: str,
        count: int,
        candidate_skills: list[str] | None = None,
    ) -> list[GeneratedQuestion]:
        ...


class ISeedTopicGenerationProvider(ABC):
    """
    Port: resume-aware seed topic generation for realtime voice interviews.

    Unlike IQuestionGenerationProvider (which generates generic questions
    from domain+skills), this provider receives the full parsed resume
    and produces rich, context-specific interview directives that
    InterviewOrchestrator drip-feeds to Ultravox via ask_next_question.
    """

    @abstractmethod
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
        ...


class IResumeExtractionProvider(ABC):
    @abstractmethod
    def parse(self, file_path: str) -> ResumeExtractionResult:
        ...


class IFeedbackGenerationProvider(ABC):
    @abstractmethod
    def generate(self, session_context: dict[str, Any]) -> FeedbackResult:
        ...