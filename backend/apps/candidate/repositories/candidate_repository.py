from typing import Optional

from core.repositories import DjangoModelRepository

from apps.candidate.models import CandidateProfile


class CandidateProfileRepository(DjangoModelRepository[CandidateProfile]):
    model = CandidateProfile

    def get_by_user(self, user) -> Optional[CandidateProfile]:
        return self.model.objects.filter(user=user).first()
