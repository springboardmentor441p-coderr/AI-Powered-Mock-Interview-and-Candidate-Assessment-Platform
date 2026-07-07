from django.urls import path

from apps.candidate.api.views.profile_views import CandidateProfileView

app_name = "candidate"

urlpatterns = [
    path("profile/", CandidateProfileView.as_view(), name="candidate_profile"),
]
