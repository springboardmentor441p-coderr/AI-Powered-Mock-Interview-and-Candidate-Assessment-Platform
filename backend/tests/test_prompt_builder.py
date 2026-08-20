from app.services.conversation_memory import ConversationMemory, InterviewStage
from app.services.interview_agent import InterviewAgent
from app.services.llm_service import LLMResponse
from app.services.prompt_builder import PromptBuilder
from app.services.resume_context import ResumeContext
from app.services.resume_analysis import generate_follow_up, questions_are_similar
import asyncio
import json


def test_live_prompt_contains_system_and_dynamic_interview_context():
    memory = ConversationMemory(
        candidate_resume="Candidate built APIs.",
        job_description="Build reliable backend services.",
        candidate_skills=["Python", "FastAPI"],
        company_name="SmartHire",
        target_role="Backend Engineer",
        interview_stage=InterviewStage.TECHNICAL,
        current_technical_topic="PostgreSQL",
    )
    memory.record_question("Tell me about an API you built.")
    memory.record_answer("I used FastAPI and PostgreSQL for a hospital system.", score=78, feedback="Clear example.")

    prompt = PromptBuilder().build(
        memory,
        resume_context=ResumeContext(projects=["Hospital Management System"], technologies=["PostgreSQL"]),
    )

    assert prompt
    assert "Hi there! Thanks for joining today." in prompt
    assert "Backend Engineer" in prompt
    assert "Build reliable backend services." in prompt
    assert "Hospital Management System" in prompt
    assert "I used FastAPI and PostgreSQL" in prompt
    assert "Interview stage: technical" in prompt


def test_warmup_reply_without_topic_cannot_become_a_technical_follow_up():
    memory = ConversationMemory(interview_stage=InterviewStage.WARM_UP)
    memory.record_question("Hi there! Thanks for joining today. How are you doing?")
    memory.record_answer("I'm doing well, thank you. I'm excited about the opportunity.")

    assert not memory.has_candidate_introduced_a_topic


class _IncorrectWarmupService:
    async def generate(self, request):
        return LLMResponse(
            content=json.dumps({
                "action": "follow_up", "stage": "warm_up",
                "question": "You mentioned that approach. Why did you choose it?",
                "topic": "approach", "covered_topics": [], "next_topics": [],
                "reason": "", "evaluation": {},
            }),
            provider="test",
        )


def test_warmup_agent_replaces_an_ungrounded_llm_reference():
    memory = ConversationMemory(interview_stage=InterviewStage.WARM_UP)
    memory.record_question("Hi there! Thanks for joining today. How are you doing?")
    memory.record_answer("I'm doing well, thank you. I'm excited about the opportunity.")

    decision = asyncio.run(InterviewAgent(memory).decide_next_question(_IncorrectWarmupService()))

    assert decision.stage is InterviewStage.INTRODUCTION
    assert "briefly introduce yourself" in decision.question.lower()
    assert "approach" not in decision.question.lower()


def test_ungrounded_rest_api_reference_is_replaced_but_a_grounded_one_is_allowed():
    memory = ConversationMemory(interview_stage=InterviewStage.EXPERIENCE)
    memory.record_question("Tell me about your background.")
    memory.record_answer("I am excited to grow as a frontend developer.")
    assert not memory.candidate_history_mentions("REST API")
    assert InterviewAgent(memory)._requires_grounded_transition("You mentioned REST API. Why did you choose it?")

    memory.record_question("Tell me about a relevant project.")
    memory.record_answer("I built a React application that consumed REST APIs.")
    assert memory.candidate_history_mentions("REST APIs")
    assert not InterviewAgent(memory)._requires_grounded_transition("You mentioned REST APIs. Why did you choose them?")


def test_agent_has_no_hard_five_question_completion_rule():
    memory = ConversationMemory()
    agent = InterviewAgent(memory)
    for number in range(6):
        agent.record_question(f"Question {number}")
        agent.record_answer("This is a meaningful answer with a concrete example.")
    assert not agent.is_complete


def test_resume_date_cannot_be_represented_as_a_candidate_statement():
    memory = ConversationMemory(
        candidate_resume="Frontend internship, Jul 2025 - Sep 2025. Created a dynamic platform with real-time scoring.",
        interview_stage=InterviewStage.TECHNICAL,
    )
    memory.record_question("Tell me about a challenge you faced.")
    memory.record_answer("The main challenge was handling communication between the frontend and Flask backend using API requests.")

    assert InterviewAgent(memory)._requires_grounded_transition(
        "You mentioned working from Jul 2025 - Sep 2025. What did you learn?"
    )


def test_deterministic_fallback_does_not_concatenate_raw_project_metadata():
    raw_project = "Created a dynamic platform that includes real-time scoring, custom error handling, and a responsive interface"
    question = __import__("app.services.resume_analysis", fromlist=["generate_follow_up"]).generate_follow_up(
        "Tell me about your recent work.",
        "I learned to collaborate closely with my team.",
        [],
        "Frontend Developer",
        context={"projects": [raw_project]},
        history=[{"question": "Q1", "answer": "A1"}] * 4,
    )

    assert raw_project not in question
    assert question == "What would you improve or scale next in a project you have worked on?"


def test_flask_and_api_details_from_candidate_answer_get_a_natural_follow_up():
    answer = (
        "The main challenge was handling the communication between the frontend and Flask backend. "
        "I had issues with API requests and responses, so I used Flask logs and tested the endpoints."
    )
    question = __import__("app.services.resume_analysis", fromlist=["generate_follow_up"]).generate_follow_up(
        "Tell me about a challenge.", answer, [], "Frontend Developer", history=[{"question": "Q1", "answer": "A1"}] * 4
    )

    assert "Flask backend and API communication" in question
    assert "What would you improve or scale next?" in question


def test_warmup_readiness_moves_to_introduction_without_a_technical_topic():
    memory = ConversationMemory(interview_stage=InterviewStage.WARM_UP)
    memory.record_question("Hi there! Thanks for joining today. Are you ready to begin?")
    memory.record_answer("Yes, I am ready and excited to begin.")
    decision = asyncio.run(InterviewAgent(memory).decide_next_question(_IncorrectWarmupService()))
    assert decision.stage is InterviewStage.INTRODUCTION
    assert "briefly introduce yourself" in decision.question.lower()


def test_near_duplicate_api_scaling_question_is_rejected():
    memory = ConversationMemory(interview_stage=InterviewStage.TECHNICAL)
    memory.record_question("You mentioned API. What would you improve or scale next?")
    memory.record_answer("I would improve monitoring and add caching.")
    assert InterviewAgent(memory).is_repetitive_question("What would you improve or scale next in the API?")
    assert questions_are_similar("You mentioned API. What would you improve or scale next?", "What would you improve or scale next in the API?")


def test_fallback_regenerates_when_the_static_lesson_question_was_already_asked():
    history = [{"question": "Can you describe one lesson from your previous answer that would make you more effective as a Backend Developer?", "answer": "I learned to validate inputs."}]
    question = generate_follow_up("What did you learn?", "I learned to validate inputs.", [], "Backend Developer", history=history)
    assert question != history[0]["question"]


def test_low_remaining_time_transitions_to_closing():
    memory = ConversationMemory(interview_stage=InterviewStage.TECHNICAL, remaining_seconds=75)
    memory.record_question("Explain your API design.")
    memory.record_answer("I used clear resource routes and validation.")
    decision = asyncio.run(InterviewAgent(memory).decide_next_question(_IncorrectWarmupService()))
    assert decision.action == "closing"
    assert decision.question == "Do you have any questions about the role or team?"


def test_second_follow_up_on_the_same_main_topic_transitions_to_new_coverage():
    class FollowUpService:
        async def generate(self, request):
            return LLMResponse(content=json.dumps({"action": "follow_up", "stage": "technical", "question": "You mentioned Flask. What made you choose it?", "topic": "Flask", "covered_topics": [], "next_topics": [], "reason": "", "evaluation": {}}), provider="test")

    memory = ConversationMemory(interview_stage=InterviewStage.TECHNICAL, follow_up_depth=1)
    memory.record_question("Why did you choose Flask?")
    memory.record_answer("Flask kept the API small and easy to test.")
    decision = asyncio.run(InterviewAgent(memory).decide_next_question(FollowUpService()))
    assert decision.action == "transition"
    assert decision.stage is InterviewStage.BEHAVIORAL
