from core.services import BaseService

from apps.candidate.models import CandidateProfile
from apps.candidate.repositories.candidate_repository import CandidateProfileRepository


class CandidateProfileService(BaseService):
    """All mutations on the CandidateProfile aggregate."""

    def __init__(self, repository: CandidateProfileRepository | None = None):
        super().__init__()
        self._repo = repository or CandidateProfileRepository()

    def create_default_profile(self, *, user) -> CandidateProfile:
        return self._repo.create(user=user)

    def update_profile(self, *, user, **fields) -> CandidateProfile:
        profile = self._repo.get_by_user(user)
        if profile is None:
            profile = self._repo.create(user=user)
        allowed = {"headline", "target_role", "experience_level"}
        kwargs = {k: v for k, v in fields.items() if k in allowed}
        return self._repo.update(profile, **kwargs)
