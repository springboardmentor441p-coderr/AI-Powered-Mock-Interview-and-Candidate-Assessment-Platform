from typing import Any, cast

from rest_framework import generics, permissions, status
from rest_framework.request import Request
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.responses import APIResponse

from apps.identity.api.serializers import (
    ChangePasswordSerializer,
    RegisterSerializer,
    SmartHireTokenObtainPairSerializer,
    UserSerializer,
)
from apps.identity.models import User


class RegisterView(generics.GenericAPIView):
    """Public registration endpoint. Delegates persistence to `AuthService`."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request: Request, *args: Any, **kwargs: Any):
        from core.container import container

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = cast(dict[str, Any], serializer.validated_data)

        auth_service = container.auth_service()
        user = auth_service.register(
            email=data["email"],
            password=data["password"],
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            role=data["role"],
        )
        return APIResponse.created(data=UserSerializer(user).data, message="Account created successfully.")


class LoginView(TokenObtainPairView):
    """Built on SimpleJWT's TokenObtainPairView; only the serializer is customized."""

    serializer_class = SmartHireTokenObtainPairSerializer


class RefreshTokenView(TokenRefreshView):
    """Re-exported as-is to keep all auth endpoints under apps.identity.api.urls."""


class LogoutView(APIView):
    """
    Idempotent logout endpoint. Blacklists the provided refresh token.
    AllowAny allows candidates and recruiters to cleanly log out even if
    their access token has expired (avoiding 401 refresh loops on logout).
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request: Request, *args: Any, **kwargs: Any):
        refresh = request.data.get("refresh")
        if refresh:
            try:
                token = RefreshToken(refresh)
                token.blacklist()
            except Exception:
                # Token already blacklisted, expired, or malformed — logout remains safe and idempotent
                pass
        return APIResponse.success(message="Logged out successfully.", http_status=status.HTTP_200_OK)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self) -> User:  # type: ignore[override]
        return self.request.user  # type: ignore[return-value]

    def perform_update(self, serializer):
        from core.container import container

        user_service = container.user_service()
        user_service.update_profile(user=self.request.user, **serializer.validated_data)  # type: ignore[arg-type]


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request, *args: Any, **kwargs: Any):
        from core.container import container

        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = cast(dict[str, Any], serializer.validated_data)

        auth_service = container.auth_service()
        auth_service.change_password(
            user=request.user,
            old_password=data["old_password"],
            new_password=data["new_password"],
        )
        return APIResponse.success(message="Password updated successfully.", http_status=status.HTTP_200_OK)
