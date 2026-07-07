from rest_framework import serializers

from apps.resume.models import ExtractedSkill, Resume


class ExtractedSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExtractedSkill
        fields = ("id", "name", "category", "confidence")
        read_only_fields = fields


class ResumeSerializer(serializers.ModelSerializer):
    extracted_skills = ExtractedSkillSerializer(many=True, read_only=True)

    class Meta:
        model = Resume
        fields = (
            "id", "original_filename", "status", "summary",
            "experience_years", "skills", "technologies", "education",
            "failure_reason", "is_primary", "extracted_skills",
            "created_at", "updated_at",
        )
        read_only_fields = fields


class ResumeUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    make_primary = serializers.BooleanField(default=True, required=False)
