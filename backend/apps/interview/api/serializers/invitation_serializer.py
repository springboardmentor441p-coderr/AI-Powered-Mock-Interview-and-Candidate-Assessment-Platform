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

    class Meta:
        model = InterviewInvitation
        fields = (
            "id", "candidate_email", "candidate_name",
            "template", "message", "status",
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

    class Meta:
        model = InterviewInvitation
        fields = (
            "id", "recruiter_name", "template", "message",
            "status", "session_id", "created_at",
        )
        read_only_fields = fields

    def get_recruiter_name(self, obj) -> str:
        return obj.recruiter.get_full_name()

    # Expose session_id directly
    session_id = serializers.SerializerMethodField()

    def get_session_id(self, obj) -> str | None:
        if obj.session:
            return str(obj.session.id)
        return None