from app.services.resume_analysis import generate_follow_up, generate_questions, is_meaningful_answer, question_identity, questions_are_similar


def test_opening_generation_returns_only_one_question():
    questions = generate_questions(
        ["Python", "SQL"], True, "Backend Developer",
        {"projects": ["Inventory API"], "technologies": ["FastAPI"]},
        "Intermediate", "1 year",
    )
    assert len(questions) == 1


def test_follow_up_uses_candidate_stated_detail_without_repeating_history():
    history = [{
        "question": "Tell me about Inventory API.",
        "answer": "I built an Inventory API using FastAPI and PostgreSQL for stock updates.",
    }]
    question = generate_follow_up(
        history[-1]["question"], history[-1]["answer"], ["Python", "SQL"],
        "Backend Developer", "Intermediate",
        {"projects": ["Inventory API"], "technologies": ["FastAPI", "PostgreSQL"]}, history,
    )
    assert question not in {item["question"] for item in history}
    assert "FastAPI" in question


def test_question_identity_and_similarity_reject_duplicate_variants():
    assert question_identity(" How did you test it? ") == question_identity("how  did you test it!!!")
    assert questions_are_similar(
        "You mentioned API. What would you improve or scale next?",
        "What would you improve or scale next in the API?",
    )


def test_answer_meaningfulness_requires_more_than_a_one_word_response():
    assert not is_meaningful_answer("")
    assert not is_meaningful_answer("Python")
    assert is_meaningful_answer("I used Python and FastAPI to build and test an inventory API.")
