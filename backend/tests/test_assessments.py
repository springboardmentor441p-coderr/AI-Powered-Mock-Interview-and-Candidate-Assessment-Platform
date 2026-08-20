def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_analytics_is_zero_state_with_no_completed_interviews(client, register_user):
    candidate = register_user("candidate")
    response = client.get("/assessments/analytics", headers=_auth_header(candidate["access_token"]))
    assert response.status_code == 200
    body = response.json()
    assert body["interviews_completed"] == 0
    assert body["average_score"] is None
    assert body["recent_history"] == []


def test_analytics_reflects_real_completed_interview_data(client, register_user, seed_completed_interview):
    candidate = register_user("candidate")
    seed_completed_interview(candidate["user"]["id"])

    response = client.get("/assessments/analytics", headers=_auth_header(candidate["access_token"]))
    assert response.status_code == 200
    body = response.json()
    assert body["interviews_completed"] == 1
    assert body["average_score"] is not None
    assert body["best_score"] == body["average_score"]
    assert len(body["recent_history"]) == 1
    assert body["recent_history"][0]["score"] == body["average_score"]
    # Category scores must be present and derived from the real rubric, not hardcoded offsets.
    assert body["communication_score"] is not None
    assert body["technical_relevance_score"] is not None
    assert isinstance(body["strengths"], list) and isinstance(body["weaknesses"], list)


def test_my_history_includes_category_scores_for_completed_interview(client, register_user, seed_completed_interview):
    candidate = register_user("candidate")
    seed_completed_interview(candidate["user"]["id"])

    response = client.get("/assessments/my-history", headers=_auth_header(candidate["access_token"]))
    assert response.status_code == 200
    rows = response.json()
    assert len(rows) == 1
    assert rows[0]["score"] is not None
    assert rows[0]["communication"] is not None
    assert rows[0]["technical_knowledge"] is not None


def test_report_endpoint_returns_pdf_for_owning_candidate(client, register_user, seed_completed_interview):
    candidate = register_user("candidate")
    interview = seed_completed_interview(candidate["user"]["id"])

    response = client.get(f"/assessments/{interview.id}/report", headers=_auth_header(candidate["access_token"]))
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment" in response.headers["content-disposition"]
    assert response.content[:4] == b"%PDF"


def test_report_endpoint_rejects_another_candidate(client, register_user, seed_completed_interview):
    owner = register_user("candidate")
    other = register_user("candidate")
    interview = seed_completed_interview(owner["user"]["id"])

    response = client.get(f"/assessments/{interview.id}/report", headers=_auth_header(other["access_token"]))
    assert response.status_code == 403


def test_report_endpoint_allows_recruiter_access(client, register_user, seed_completed_interview):
    candidate = register_user("candidate")
    recruiter = register_user("recruiter")
    interview = seed_completed_interview(candidate["user"]["id"])

    response = client.get(f"/assessments/{interview.id}/report", headers=_auth_header(recruiter["access_token"]))
    assert response.status_code == 200
    assert response.content[:4] == b"%PDF"


def test_report_endpoint_requires_completed_interview(client, register_user, db_session):
    from app.models import Interview, InterviewProfile, InterviewQuestion

    candidate = register_user("candidate")
    interview = Interview(candidate_id=candidate["user"]["id"], status="in_progress")
    db_session.add(interview)
    db_session.flush()
    db_session.add(InterviewProfile(interview_id=interview.id, role_title="Backend Developer", mode="general", difficulty="Intermediate", resume_context="{}"))
    db_session.add(InterviewQuestion(interview_id=interview.id, order_number=0, question="Hi there!"))
    db_session.commit()

    response = client.get(f"/assessments/{interview.id}/report", headers=_auth_header(candidate["access_token"]))
    assert response.status_code == 400


def test_report_endpoint_requires_authentication(client):
    response = client.get("/assessments/999/report")
    assert response.status_code in (401, 403)
