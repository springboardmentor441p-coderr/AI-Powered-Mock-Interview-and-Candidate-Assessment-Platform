"""
Dynamic prompt construction for the interview engine.

This module owns interviewer personas, interview-mode rules, stage plans,
and job-role context loading so InterviewAgent can focus on orchestration.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

InterviewType = Literal["technical", "hr"]

SUPPORTED_INTERVIEW_TYPES: tuple[str, ...] = ("technical", "hr")

TECHNICAL_INTERVIEW_STAGES: list[str] = [
    "WARM_UP",
    "EXPERIENCE",
    "TECHNICAL_DEEP_DIVE",
    "BEHAVIORAL",
    "CLOSING",
]

HR_INTERVIEW_STAGES: list[str] = [
    "INTRODUCTION",
    "CAREER_MOTIVATION",
    "COMMUNICATION",
    "TEAMWORK",
    "LEADERSHIP",
    "CONFLICT_RESOLUTION",
    "TIME_MANAGEMENT",
    "STRENGTHS_WEAKNESSES",
    "ADAPTABILITY_LEARNING",
    "CAREER_GOALS",
    "COMPANY_FIT",
    "CLOSING",
]

STAGE_TOPICS: dict[str, str] = {
    "WARM_UP": "Warm-up",
    "EXPERIENCE": "Experience",
    "TECHNICAL_DEEP_DIVE": "Technical Deep Dive",
    "BEHAVIORAL": "Behavioral",
    "INTRODUCTION": "Introduction",
    "CAREER_MOTIVATION": "Career Motivation",
    "COMMUNICATION": "Communication",
    "TEAMWORK": "Teamwork",
    "LEADERSHIP": "Leadership",
    "CONFLICT_RESOLUTION": "Conflict Resolution",
    "TIME_MANAGEMENT": "Time Management",
    "STRENGTHS_WEAKNESSES": "Strengths and Weaknesses",
    "ADAPTABILITY_LEARNING": "Adaptability and Learning",
    "CAREER_GOALS": "Career Goals",
    "COMPANY_FIT": "Company Fit",
    "CLOSING": "Closing",
}

TECHNICAL_PERSONA = """
You are Sarah Chen, a Senior Technical Hiring Manager with 12 years of
experience evaluating software engineers.

You interview like a thoughtful hiring manager:
- greet warmly and keep the tone professional
- ask exactly one question at a time
- actively listen to and briefly acknowledge the candidate's previous answer
- ground every new question in a concrete point from the latest answer
- explore one thread through progressively deeper follow-ups before changing topics
- transition explicitly and naturally when a thread has been explored sufficiently
- adapt questions to the candidate's resume and selected job role
- never repeat previously asked questions
- never dump multiple questions together
- never reveal ideal answers or scoring rubrics

Technical interview structure:
1. Warm-up
2. Experience
3. Technical Deep Dive
4. Behavioral
5. Closing
"""

HR_PERSONA = """
You are Emily Rodriguez, a Senior HR Business Partner with 10+ years of
experience assessing communication, motivation, teamwork, and culture fit.

You interview like a supportive but discerning HR leader:
- greet warmly and keep the conversation calm and professional
- ask exactly one question at a time
- actively listen to and briefly acknowledge the candidate's previous answer
- ground every new question in a concrete point from the latest answer
- explore one thread through progressively deeper follow-ups before changing topics
- ask for specific examples when answers are vague, short, or incomplete
- avoid technical implementation questions
- adapt questions to the candidate's resume, experience, and goals
- never repeat previously asked questions
- never dump multiple questions together
- never reveal ideal answers or scoring rubrics

HR interview focus areas:
Introduction, Career Motivation, Communication, Teamwork, Leadership,
Conflict Resolution, Time Management, Strengths, Weaknesses, Adaptability,
Learning, Career Goals, and Company Fit.
"""


def normalize_interview_type(interview_type: str | None) -> InterviewType:
    """Return a supported interview type, defaulting missing values to technical."""
    normalized = (interview_type or "technical").strip().lower()
    if normalized not in SUPPORTED_INTERVIEW_TYPES:
        raise ValueError(
            "interview_type must be one of: technical, hr."
        )
    return normalized  # type: ignore[return-value]


def get_stage_plan(interview_type: str | None) -> list[str]:
    """Return the ordered interview stages for the selected interview mode."""
    normalized = normalize_interview_type(interview_type)
    if normalized == "hr":
        return HR_INTERVIEW_STAGES
    return TECHNICAL_INTERVIEW_STAGES


def get_stage_topic(stage: str) -> str:
    """Return a human-friendly topic name for a stage code."""
    return STAGE_TOPICS.get(stage, stage.replace("_", " ").title())


@lru_cache(maxsize=1)
def load_job_roles() -> dict[str, dict[str, Any]]:
    """Load predefined job-role context from the repository JSON file."""
    roles_path = Path(__file__).resolve().parents[1] / "data" / "job_roles.json"
    with roles_path.open("r", encoding="utf-8") as roles_file:
        return json.load(roles_file)


def get_job_context(job_role: str) -> dict[str, Any]:
    """Return configured job context, falling back to an extendable generic role."""
    roles = load_job_roles()
    if job_role in roles:
        return {
            "job_title": job_role,
            **roles[job_role],
        }

    return {
        "job_title": job_role,
        "domain": "General Software Engineering",
        "seniority": "Entry",
        "company_context": "A professional software team evaluating role readiness.",
        "key_skills": [],
        "nice_to_have": [],
        "responsibilities": [],
    }


def build_prompt(
    interview_type: str,
    job_context: dict[str, Any],
    resume: dict[str, Any],
    conversation_history: list[dict[str, Any]],
    interview_state: dict[str, Any],
) -> list[dict[str, str]]:
    """
    Build a complete next-question prompt for the selected interview mode.

    The prompt combines persona, role context, resume data, current stage,
    previous conversation, asked questions, and the latest candidate answer.
    """
    normalized_type = normalize_interview_type(interview_type)
    persona = HR_PERSONA if normalized_type == "hr" else TECHNICAL_PERSONA
    mode_rules = _build_mode_rules(normalized_type, job_context)

    user_prompt = f"""
Interview Type
{normalized_type}

Job Context
{json.dumps(job_context, indent=2)}

Candidate Resume
{json.dumps(resume, indent=2)}

Current Interview State
{json.dumps(interview_state, indent=2)}

Previous Conversation
{json.dumps(conversation_history, indent=2)}

Generate the next interviewer turn.

Rules:
1. Read the complete latest candidate answer before deciding what to ask.
2. Start with a brief, natural acknowledgement grounded in something the candidate
   actually said. Vary the wording; do not praise unsupported claims.
3. Then ask exactly ONE question about ONE concrete topic from the latest answer.
4. Prefer a deeper follow-up on the active thread (role, reasoning, architecture,
   challenge, tradeoff, result, or lesson) over switching topics.
5. If that thread has already been explored sufficiently in Previous Conversation,
   transition smoothly to another topic the candidate previously mentioned.
6. The current stage is guidance, not permission to ignore the latest answer.
7. Use the complete Previous Conversation as memory. Track claims, technologies,
   projects, internships, inconsistencies, and covered topics.
8. Never repeat or closely paraphrase a question in interview_state.questions_asked.
9. Do not invent resume details, project details, company facts, metrics, or tools.
10. Return only the acknowledgement and question. Do not include analysis, labels,
    bullet points, scoring, or phrases such as "I will ask".
11. Follow interview_state.time_mode:
   - DETAILED: allow a normal depth question.
   - CONCISE: ask a focused question that can be answered briefly.
   - WRAP_UP: ask only a short closing question and do not open a new topic.
"""

    return [
        {
            "role": "system",
            "content": f"{persona}\n\n{mode_rules}",
        },
        {
            "role": "user",
            "content": user_prompt,
        },
    ]


def _build_mode_rules(interview_type: InterviewType, job_context: dict[str, Any]) -> str:
    """Create concise mode-specific guidance for the selected interviewer."""
    if interview_type == "hr":
        return """
Mode-specific guidance:
- Focus on communication, motivation, teamwork, leadership, conflict handling,
  time management, adaptability, learning mindset, goals, and company fit.
- Do not ask technical implementation or coding-detail questions.
- Use the job context only to frame workplace expectations and fit.
"""

    return f"""
Mode-specific guidance:
- Focus on {job_context.get("domain", "the role")} and the selected role.
- Dynamically use the job title, seniority, responsibilities, key skills,
  and nice-to-have skills when forming questions.
- Probe practical technical depth, tradeoffs, debugging, API design, data
  handling, testing, and project ownership where relevant.
"""
