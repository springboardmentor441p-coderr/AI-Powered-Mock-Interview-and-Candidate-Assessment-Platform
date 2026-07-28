"""
Serializers for the real-time face assessment snapshot endpoint.
"""
from rest_framework import serializers

from apps.assessment.models.face_assessment_snapshot import FaceAssessmentSnapshot


class FaceSnapshotIngestSerializer(serializers.Serializer):
    """
    Validates a single face snapshot payload sent from the browser every ~2 s.
    Uses a plain Serializer (not ModelSerializer) so we can enforce strict
    input shape and keep the view independent of model internals.
    """

    sequence = serializers.IntegerField(min_value=0)
    face_detected = serializers.BooleanField()
    multiple_faces_detected = serializers.BooleanField(default=False)
    gaze_on_screen = serializers.BooleanField()

    eye_contact_score = serializers.FloatField(min_value=0.0, max_value=100.0)
    attention_score = serializers.FloatField(min_value=0.0, max_value=100.0)
    engagement_score = serializers.FloatField(min_value=0.0, max_value=100.0)

    dominant_emotion = serializers.CharField(max_length=30, default="neutral", allow_blank=True)
    emotion_breakdown = serializers.DictField(
        child=serializers.FloatField(min_value=0.0, max_value=1.0),
        required=False,
        default=dict,
    )
    emotion_confidence = serializers.FloatField(min_value=0.0, max_value=100.0, default=0.0)

    yaw = serializers.FloatField(default=0.0)
    pitch = serializers.FloatField(default=0.0)
    roll = serializers.FloatField(default=0.0)


class FaceAssessmentSummarySerializer(serializers.Serializer):
    """
    Read-only summary returned when the frontend polls for aggregated stats.
    """

    snapshot_count = serializers.IntegerField()
    avg_eye_contact_score = serializers.FloatField(allow_null=True)
    avg_attention_score = serializers.FloatField(allow_null=True)
    avg_engagement_score = serializers.FloatField(allow_null=True)
    face_detected_pct = serializers.FloatField(allow_null=True)
    dominant_emotion = serializers.CharField(allow_blank=True)
    emotion_breakdown = serializers.DictField(child=serializers.FloatField(), allow_null=True)