from rest_framework import serializers

from apps.interview.models import InterviewInvitation, InterviewTemplate
from apps.interview.api.serializers.interview_serializer import InterviewTemplateSerializer


class SendInvitationSerializer(serializers.Serializer):
    candidate_email = serializers.EmailField()
    template_id = serializers.UUIDField(required=False, allow_null=True)
    message = serializers.CharField(required=False, allow_blank=True, default="")


class InvitationListSerializer(serializers.ModelSerializer):
    """Used by recruiter to see sent invitations."""
    template = InterviewTemplateSerializer(read_only=True)
    candidate_name = serializers.SerializerMethodField()
    session_id = serializers.SerializerMethodField()
    session_status = serializers.SerializerMethodField()
    has_result = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = InterviewInvitation
        fields = (
            "id", "token", "candidate_email", "candidate_name",
            "template", "message", "status", "expires_at", "is_expired",
            "session_id", "session_status", "has_result",
            "created_at", "updated_at",
        )
        read_only_fields = fields

    def get_candidate_name(self, obj) -> str | None:
        if obj.candidate:
            return obj.candidate.get_full_name()
        return None

    def get_session_id(self, obj) -> str | None:
        if obj.session:
            return str(obj.session.id)
        return None

    def get_session_status(self, obj) -> str | None:
        if obj.session:
            return obj.session.status
        return None

    def get_has_result(self, obj) -> bool:
        if obj.session and obj.session.status == "completed":
            return True
        return False


class CandidateInvitationSerializer(serializers.ModelSerializer):
    """Used by candidate to see received invitations."""
    template = InterviewTemplateSerializer(read_only=True)
    recruiter_name = serializers.SerializerMethodField()
    session_id = serializers.SerializerMethodField()
    session_status = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = InterviewInvitation
        fields = (
            "id", "token", "recruiter_name", "template", "message",
            "status", "expires_at", "is_expired", "session_id",
            "session_status", "created_at",
        )
        read_only_fields = fields

    def get_recruiter_name(self, obj) -> str:
        return obj.recruiter.get_full_name() or obj.recruiter.email

    def get_session_id(self, obj) -> str | None:
        if obj.session:
            return str(obj.session.id)
        return None

    def get_session_status(self, obj) -> str | None:
        if obj.session:
            return obj.session.status
        return None


class PublicInvitationSerializer(serializers.ModelSerializer):
    """Exposes public non-sensitive details when candidate opens /invite/:token."""
    template = InterviewTemplateSerializer(read_only=True)
    recruiter_name = serializers.SerializerMethodField()
    session_id = serializers.SerializerMethodField()
    session_status = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = InterviewInvitation
        fields = (
            "id", "token", "recruiter_name", "candidate_email", "template",
            "message", "status", "expires_at", "is_expired",
            "session_id", "session_status", "created_at",
        )
        read_only_fields = fields

    def get_recruiter_name(self, obj) -> str:
        return obj.recruiter.get_full_name() or obj.recruiter.email

    def get_session_id(self, obj) -> str | None:
        if obj.session:
            return str(obj.session.id)
        return None

    def get_session_status(self, obj) -> str | None:
        if obj.session:
            return obj.session.status
        return None