from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.identity.models import Organization, Role, User


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ("id", "name", "domain", "created_at")
        read_only_fields = ("id", "created_at")


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="get_full_name", read_only=True)
    candidate_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "phone_number",
            "avatar",
            "is_email_verified",
            "organization",
            "candidate_profile",
            "created_at",
        )
        read_only_fields = ("id", "role", "is_email_verified", "created_at")

    def get_candidate_profile(self, obj):
        profile = getattr(obj, "candidate_profile", None)
        if profile is None:
            return None
        from apps.candidate.api.serializers.profile_serializer import CandidateProfileSerializer

        return CandidateProfileSerializer(profile).data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=Role.choices, default=Role.CANDIDATE)

    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "password", "password_confirm", "role")

    def validate_role(self, value):
        # Self-registration as admin is never allowed via the public API;
        # admins are provisioned via the Django admin or an existing admin.
        if value == Role.ADMIN:
            raise serializers.ValidationError("Admin accounts cannot be self-registered.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])


class SmartHireTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Extends SimpleJWT's serializer to embed role/email claims in the token."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["email"] = user.email
        token["full_name"] = user.get_full_name()
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data  # type: ignore[assignment]
        return data
