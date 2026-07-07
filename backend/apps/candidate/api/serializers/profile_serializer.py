from rest_framework import serializers

from apps.candidate.models import CandidateProfile


class CandidateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidateProfile
        fields = ("headline", "target_role", "experience_level", "created_at", "updated_at")
        read_only_fields = ("created_at", "updated_at")
