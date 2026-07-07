from rest_framework import serializers

from apps.assessment.models import FinalScore, SpeechAnalysis
from apps.assessment.models.session_feedback import SessionFeedback


class SpeechAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpeechAnalysis
        fields = ("id", "status", "transcript", "transcription_confidence", "grammar_score",
                  "filler_word_count", "filler_words", "speaking_pace_wpm", "clarity_score",
                  "completeness_score", "dominant_emotion", "emotion_breakdown", "confidence_score",
                  "eye_contact_percentage", "attention_score", "engagement_score",
                  "failure_reason", "created_at", "updated_at")
        read_only_fields = fields


class FinalScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinalScore
        fields = ("id", "communication", "confidence", "technical_relevance", "professionalism",
                  "overall", "rating", "breakdown", "created_at")
        read_only_fields = fields


class SessionFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionFeedback
        fields = ("id", "strengths", "weaknesses", "improvement_suggestions",
                  "practice_recommendations", "learning_resources", "created_at")
        read_only_fields = fields
