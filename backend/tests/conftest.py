import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set env var before imports
os.environ["DATABASE_URL"] = "sqlite://"

from app.main import app as fastapi_app
from app.database.base import Base
from app.database.session import get_db

# Create an in-memory SQLite database for testing
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Patch the middleware SessionLocal to use the testing session
import app.middleware.auth
app.middleware.auth.SessionLocal = TestingSessionLocal


@pytest.fixture(name="db_session")
def fixture_db_session():
    """Create a clean database session for a test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(name="client")
def fixture_client(db_session):
    """Override database dependency and yield test client."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    fastapi_app.dependency_overrides[get_db] = override_get_db
    with TestClient(fastapi_app) as test_client:
        yield test_client
    fastapi_app.dependency_overrides.clear()


@pytest.fixture(name="auth_headers")
def fixture_auth_headers(client):
    """Register and login a candidate to get headers."""
    reg_payload = {
        "username": "testcandidate",
        "email": "candidate@example.com",
        "password": "securepassword123",
        "role": "candidate"
    }
    client.post("/api/v1/auth/register", json=reg_payload)
    login_response = client.post("/api/v1/auth/login", json={
        "email": "candidate@example.com",
        "password": "securepassword123"
    })
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(name="admin_headers")
def fixture_admin_headers(client):
    """Register and login an admin to get headers."""
    reg_payload = {
        "username": "testadmin",
        "email": "admin@example.com",
        "password": "securepassword123",
        "role": "admin"
    }
    client.post("/api/v1/auth/register", json=reg_payload)
    login_response = client.post("/api/v1/auth/login", json={
        "email": "admin@example.com",
        "password": "securepassword123"
    })
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
