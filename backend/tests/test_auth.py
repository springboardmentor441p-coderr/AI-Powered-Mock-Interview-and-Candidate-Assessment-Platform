def test_register_and_login_success(client):
    # Test User Registration
    reg_response = client.post("/api/v1/auth/register", json={
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "securepassword123",
        "role": "candidate"
    })
    assert reg_response.status_code == 201
    reg_data = reg_response.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["username"] == "newuser"
    assert reg_data["user"]["email"] == "newuser@example.com"
    assert reg_data["user"]["role"] == "candidate"

    # Test User Login
    login_response = client.post("/api/v1/auth/login", json={
        "email": "newuser@example.com",
        "password": "securepassword123"
    })
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "access_token" in login_data
    assert login_data["user"]["email"] == "newuser@example.com"


def test_register_duplicate_username_fails(client):
    payload = {
        "username": "dupuser",
        "email": "first@example.com",
        "password": "securepassword123",
        "role": "candidate"
    }
    # First time succeeds
    response1 = client.post("/api/v1/auth/register", json=payload)
    assert response1.status_code == 201

    # Second time fails
    payload["email"] = "second@example.com"
    response2 = client.post("/api/v1/auth/register", json=payload)
    assert response2.status_code == 400
    assert "already taken" in response2.json()["detail"].lower()


def test_register_duplicate_email_fails(client):
    payload = {
        "username": "user1",
        "email": "dup@example.com",
        "password": "securepassword123",
        "role": "candidate"
    }
    # First time succeeds
    response1 = client.post("/api/v1/auth/register", json=payload)
    assert response1.status_code == 201

    # Second time fails
    payload["username"] = "user2"
    response2 = client.post("/api/v1/auth/register", json=payload)
    assert response2.status_code == 400
    assert "already registered" in response2.json()["detail"].lower()


def test_login_invalid_credentials_fails(client):
    # Register first
    client.post("/api/v1/auth/register", json={
        "username": "activeuser",
        "email": "active@example.com",
        "password": "securepassword123",
        "role": "candidate"
    })

    # Wrong password
    response1 = client.post("/api/v1/auth/login", json={
        "email": "active@example.com",
        "password": "wrongpassword12"
    })
    assert response1.status_code == 410 or response1.status_code == 401
    assert "invalid" in response1.json()["detail"].lower()

    # Wrong email
    response2 = client.post("/api/v1/auth/login", json={
        "email": "wrong@example.com",
        "password": "securepassword123"
      })
    assert response2.status_code == 410 or response2.status_code == 401
    assert "invalid" in response2.json()["detail"].lower()


def test_reset_password_success(client):
    # 1. Register candidate
    client.post("/api/v1/auth/register", json={
        "username": "resetuser",
        "email": "reset@example.com",
        "password": "oldpassword123",
        "role": "candidate"
    })

    # 2. Reset password
    reset_response = client.post("/api/v1/auth/reset-password", json={
        "email": "reset@example.com",
        "new_password": "newsecurepassword123"
    })
    assert reset_response.status_code == 200

    # 3. Log in with new password
    login_response = client.post("/api/v1/auth/login", json={
        "email": "reset@example.com",
        "password": "newsecurepassword123"
    })
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()


def test_reset_password_not_found_fails(client):
    # Reset password for non-existent email
    reset_response = client.post("/api/v1/auth/reset-password", json={
        "email": "nonexistent@example.com",
        "new_password": "newsecurepassword123"
    })
    assert reset_response.status_code == 400
    assert "not found" in reset_response.json()["detail"].lower()

