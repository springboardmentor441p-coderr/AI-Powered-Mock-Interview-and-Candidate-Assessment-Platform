from django.urls import path

from apps.resume.api.views.resume_views import ResumeDetailView, ResumeListView, ResumeReprocessView, ResumeUploadView

app_name = "resume"

urlpatterns = [
    path("", ResumeListView.as_view(), name="resume_list"),
    path("upload/", ResumeUploadView.as_view(), name="resume_upload"),
    path("<uuid:resume_id>/", ResumeDetailView.as_view(), name="resume_detail"),
    path("<uuid:resume_id>/reprocess/", ResumeReprocessView.as_view(), name="resume_reprocess"),
]
