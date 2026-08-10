def test_list_coding_challenges_success(client, auth_headers):
    # Fetch all challenges
    response = client.get("/api/v1/coding/challenges", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    # Two Sum should be seeded
    assert any(c["title"] == "Two Sum Problem" for c in data)


def test_list_coding_challenges_filter_success(client, auth_headers):
    # Filter by language
    response = client.get("/api/v1/coding/challenges?language=Python", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert all(c["language"] == "Python" for c in data)

    # Filter by domain
    response = client.get("/api/v1/coding/challenges?domain=SQL", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert all(c["domain"] == "SQL" for c in data)


def test_submit_coding_solution_success(client, auth_headers):
    # Get a challenge ID
    list_response = client.get("/api/v1/coding/challenges?language=Python&domain=Arrays", headers=auth_headers)
    challenge_id = list_response.json()[0]["id"]

    submit_payload = {
        "challenge_id": challenge_id,
        "code": "def twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []",
        "language": "Python"
    }

    # Submit solution
    response = client.post("/api/v1/coding/submit", json=submit_payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["challenge_id"] == challenge_id
    assert data["status"] == "SUCCESS"
    assert data["score"] > 50
    assert "complexity" in data
    assert "code_quality" in data


def test_submit_coding_solution_unauthorized_fails(client):
    submit_payload = {
        "challenge_id": 1,
        "code": "print('hello')",
        "language": "Python"
    }
    response = client.post("/api/v1/coding/submit", json=submit_payload)
    assert response.status_code == 401
