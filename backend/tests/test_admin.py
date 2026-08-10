def test_get_candidates_admin_success(client, admin_headers):
    # Retrieve candidates list as admin
    response = client.get("/api/v1/admin/candidates", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_candidates_candidate_forbidden_fails(client, auth_headers):
    # A candidate role user trying to access admin candidate logs should get 403
    response = client.get("/api/v1/admin/candidates", headers=auth_headers)
    assert response.status_code == 403
    assert "privileges required" in response.json()["detail"].lower()


def test_get_analytics_admin_success(client, admin_headers):
    # Retrieve analytics dashboard stats
    response = client.get("/api/v1/admin/analytics", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "distributions" in data
    assert data["metrics"]["total_candidates"] >= 0


def test_get_candidate_details_not_found(client, admin_headers):
    # Retrieve detailed candidate records for non-existent ID
    response = client.get("/api/v1/admin/interviews/99999", headers=admin_headers)
    assert response.status_code == 404
