"""
LLM AI ports: every capability backed by a general-purpose language
model (question generation, resume extraction, feedback generation).
Grouped together because in practice a single LLM provider (OpenAI,
Gemini, ...) typically implements all three.
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
class ResumeExtractionResult:
    skills: list[str]
    technologies: list[str]
    experience_years: float
    education: list[dict]
    summary: str
    raw_text: str
    experience: list[dict] = field(default_factory=list)   # ADD
    projects: list[dict] = field(default_factory=list)     # ADD

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


class IResumeExtractionProvider(ABC):
    @abstractmethod
    def parse(self, file_path: str) -> ResumeExtractionResult:
        ...


class IFeedbackGenerationProvider(ABC):
    @abstractmethod
    def generate(self, session_context: dict[str, Any]) -> FeedbackResult:
        ...
