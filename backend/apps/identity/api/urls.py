from django.urls import path
from rest_framework_simplejwt.views import TokenBlacklistView

from apps.identity.api.views import ChangePasswordView, LoginView, MeView, RefreshTokenView, RegisterView

app_name = "identity"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", RefreshTokenView.as_view(), name="token_refresh"),
    path("logout/", TokenBlacklistView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
]
