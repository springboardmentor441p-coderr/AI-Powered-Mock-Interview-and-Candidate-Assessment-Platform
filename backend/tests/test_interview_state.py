from app.services.interview_state import interview_state


def test_create_session():
    session = interview_state.create_session(
        candidate_name="John",
        job_role="Backend Developer",
        resume={},
    )

    assert session.session_id is not None
    assert session.job_role == "Backend Developer"
    assert session.question_count == 0


def test_delete_session():
    session = interview_state.create_session(
        candidate_name="John",
        job_role="Backend Developer",
        resume={},
    )

    interview_state.delete_session(session.session_id)

    assert not interview_state.session_exists(session.session_id)
