import pytest
from django.urls import reverse


@pytest.mark.django_db
class TestRegistrationAndLogin:
    def test_register_creates_candidate(self, api_client):
        url = reverse("identity:register")
        res = api_client.post(url, {
            "email": "new@example.com", "password": "StrongPass123!",
            "password_confirm": "StrongPass123!", "first_name": "Ada",
        })
        assert res.status_code == 201
        assert res.data["success"] is True

    def test_register_blocks_admin_self_registration(self, api_client):
        url = reverse("identity:register")
        res = api_client.post(url, {
            "email": "admin@example.com", "password": "StrongPass123!",
            "password_confirm": "StrongPass123!", "role": "admin",
        })
        assert res.status_code == 400

    def test_login_returns_tokens(self, api_client, candidate_user):
        url = reverse("identity:login")
        res = api_client.post(url, {"email": candidate_user.email, "password": "StrongPass123!"})
        assert res.status_code == 200
        assert "access" in res.data and "refresh" in res.data

    def test_me_requires_auth(self, api_client):
        res = api_client.get(reverse("identity:me"))
        assert res.status_code == 401

    def test_logout_succeeds_with_refresh_token(self, api_client, candidate_user):
        login_res = api_client.post(reverse("identity:login"), {"email": candidate_user.email, "password": "StrongPass123!"})
        refresh = login_res.data["refresh"]
        access = login_res.data["access"]
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        logout_res = api_client.post(reverse("identity:logout"), {"refresh": refresh})
        assert logout_res.status_code == 200

    def test_logout_succeeds_without_auth_header(self, api_client, candidate_user):
        login_res = api_client.post(reverse("identity:login"), {"email": candidate_user.email, "password": "StrongPass123!"})
        refresh = login_res.data["refresh"]
        # No Authorization header set — simulating expired access token
        logout_res = api_client.post(reverse("identity:logout"), {"refresh": refresh})
        assert logout_res.status_code == 200

    def test_logout_is_idempotent_on_invalid_or_repeated_token(self, api_client):
        logout_res = api_client.post(reverse("identity:logout"), {"refresh": "invalid_or_already_blacklisted"})
        assert logout_res.status_code == 200

    def test_refresh_after_logout_fails(self, api_client, candidate_user):
        login_res = api_client.post(reverse("identity:login"), {"email": candidate_user.email, "password": "StrongPass123!"})
        refresh = login_res.data["refresh"]

        logout_res = api_client.post(reverse("identity:logout"), {"refresh": refresh})
        assert logout_res.status_code == 200

        refresh_res = api_client.post(reverse("identity:token_refresh"), {"refresh": refresh})
        assert refresh_res.status_code == 401
