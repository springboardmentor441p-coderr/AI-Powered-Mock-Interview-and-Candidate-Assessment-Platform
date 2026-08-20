def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _seed_answerable_interview(db_session, candidate_id: int):
    from app.models import Interview, InterviewProfile, InterviewQuestion

    interview = Interview(candidate_id=candidate_id, status="in_progress")
    db_session.add(interview)
    db_session.flush()
    db_session.add(InterviewProfile(interview_id=interview.id, role_title="Backend Developer", mode="general", difficulty="Intermediate", resume_context="{}"))
    db_session.add(InterviewQuestion(interview_id=interview.id, order_number=0, question="Hi there!", answer_text="Ready."))
    db_session.add(InterviewQuestion(
        interview_id=interview.id, order_number=1, question="Tell me about a project.",
        answer_text="I built an inventory API using FastAPI and PostgreSQL and reduced latency by 30 percent.",
    ))
    db_session.commit()
    db_session.refresh(interview)
    return interview


def test_completing_an_interview_creates_notifications(client, register_user, db_session):
    candidate = register_user("candidate")
    interview = _seed_answerable_interview(db_session, candidate["user"]["id"])

    response = client.post(f"/interviews/{interview.id}/end", headers=_auth_header(candidate["access_token"]))
    assert response.status_code == 200
    assert response.json()["status"] == "completed"

    notifications = client.get("/notifications", headers=_auth_header(candidate["access_token"])).json()
    types = {item["type"] for item in notifications}
    assert {"interview_completed", "assessment_available", "report_available"}.issubset(types)
    assert all(item["is_read"] is False for item in notifications)


def test_ending_an_interview_with_no_meaningful_answers_does_not_notify(client, register_user, db_session):
    from app.models import Interview, InterviewProfile, InterviewQuestion

    candidate = register_user("candidate")
    interview = Interview(candidate_id=candidate["user"]["id"], status="in_progress")
    db_session.add(interview)
    db_session.flush()
    db_session.add(InterviewProfile(interview_id=interview.id, role_title="Backend Developer", mode="general", difficulty="Intermediate", resume_context="{}"))
    db_session.add(InterviewQuestion(interview_id=interview.id, order_number=0, question="Hi there!"))
    db_session.commit()
    db_session.refresh(interview)

    response = client.post(f"/interviews/{interview.id}/end", headers=_auth_header(candidate["access_token"]))
    assert response.status_code == 200
    assert response.json()["status"] == "incomplete"

    notifications = client.get("/notifications", headers=_auth_header(candidate["access_token"])).json()
    assert notifications == []


def test_notification_gracefully_skips_email_when_smtp_not_configured(monkeypatch, client, register_user, db_session):
    monkeypatch.delenv("SMTP_HOST", raising=False)
    candidate = register_user("candidate")
    interview = _seed_answerable_interview(db_session, candidate["user"]["id"])

    # Should not raise even though no SMTP server is configured.
    response = client.post(f"/interviews/{interview.id}/end", headers=_auth_header(candidate["access_token"]))
    assert response.status_code == 200


def test_mark_notification_read(client, register_user, db_session):
    candidate = register_user("candidate")
    interview = _seed_answerable_interview(db_session, candidate["user"]["id"])
    client.post(f"/interviews/{interview.id}/end", headers=_auth_header(candidate["access_token"]))

    notifications = client.get("/notifications", headers=_auth_header(candidate["access_token"])).json()
    target = notifications[0]
    assert target["is_read"] is False

    response = client.post(f"/notifications/{target['id']}/read", headers=_auth_header(candidate["access_token"]))
    assert response.status_code == 200
    assert response.json()["is_read"] is True

    unread = client.get("/notifications", params={"unread_only": True}, headers=_auth_header(candidate["access_token"])).json()
    assert target["id"] not in {item["id"] for item in unread}


def test_notifications_are_isolated_per_user(client, register_user, db_session):
    owner = register_user("candidate")
    other = register_user("candidate")
    interview = _seed_answerable_interview(db_session, owner["user"]["id"])
    client.post(f"/interviews/{interview.id}/end", headers=_auth_header(owner["access_token"]))

    owner_notifications = client.get("/notifications", headers=_auth_header(owner["access_token"])).json()
    other_notifications = client.get("/notifications", headers=_auth_header(other["access_token"])).json()
    assert len(owner_notifications) > 0
    assert other_notifications == []

    # Another user cannot mark someone else's notification as read.
    response = client.post(f"/notifications/{owner_notifications[0]['id']}/read", headers=_auth_header(other["access_token"]))
    assert response.status_code == 404
