from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

api_v1 = [
    path("auth/",          include("apps.identity.api.urls")),
    path("candidates/",    include("apps.candidate.api.urls")),
    path("resumes/",       include("apps.resume.api.urls")),
    path("interviews/",    include("apps.interview.api.urls")),
    path("assessments/",   include("apps.assessment.api.urls")),
    path("analytics/",     include("apps.analytics.api.urls")),
    path("notifications/", include("apps.notification.api.urls")),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_v1)),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("auth/social/", include("social_django.urls", namespace="social")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
