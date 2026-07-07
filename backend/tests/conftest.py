import pytest
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def candidate_user(db):
    from apps.identity.models import User
    from apps.candidate.models import CandidateProfile
    user = User.objects.create_user(  # type: ignore[union-attr]
        email="candidate@example.com", password="StrongPass123!", role=User.Role.CANDIDATE
    )
    CandidateProfile.objects.create(user=user)
    return user


@pytest.fixture
def recruiter_user(db):
    from apps.identity.models import User
    return User.objects.create_user(  # type: ignore[union-attr]
        email="recruiter@example.com", password="StrongPass123!", role=User.Role.RECRUITER
    )


@pytest.fixture
def auth_client(api_client, candidate_user):
    api_client.force_authenticate(user=candidate_user)
    return api_client
