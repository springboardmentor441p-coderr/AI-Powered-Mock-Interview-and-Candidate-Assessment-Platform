from rest_framework import serializers

from apps.interview.models import InterviewBrief, ThreadEvaluation, Transcript


class TranscriptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transcript
        fields = (
            "id", "speaker", "text", "sequence_number", "timestamp",
            "is_followup", "latency_ms", "confidence", "created_at",
        )
        read_only_fields = fields


class ThreadEvaluationSerializer(serializers.ModelSerializer):
    seed_topic_text = serializers.CharField(source="seed_topic.text", read_only=True)

    class Meta:
        model = ThreadEvaluation
        fields = (
            "id", "seed_topic", "seed_topic_text",
            "depth_under_pressure", "conceptual_accuracy", "specificity", "recovery",
            "overall_score", "verdict",
            "red_flags", "strong_signals", "suggested_followups",
            "requires_human_review", "human_review_reason",
            "turn_count", "candidate_turn_count",
            "model_used", "created_at",
        )
        read_only_fields = fields


class InterviewBriefSerializer(serializers.ModelSerializer):
    thread_evaluations = ThreadEvaluationSerializer(
        source="interview.thread_evaluations", many=True, read_only=True
    )

    class Meta:
        model = InterviewBrief
        fields = (
            "id",
            "overall_signal", "summary",
            "performs_under_pressure", "specificity_consistent",
            "self_contradictions_detected", "contradiction_detail",
            "red_flags", "strong_signals", "suggested_followup_questions",
            "requires_human_review",
            "human_verdict", "human_notes", "reviewed_by", "reviewed_at",
            "thread_evaluations",
            "model_used", "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "overall_signal", "summary",
            "performs_under_pressure", "specificity_consistent",
            "self_contradictions_detected", "contradiction_detail",
            "red_flags", "strong_signals", "suggested_followup_questions",
            "requires_human_review",
            "thread_evaluations", "model_used", "created_at", "updated_at",
        )


class UltravoxTranscriptEventSerializer(serializers.Serializer):
    """Posted by the Ultravox transcript webhook per finalized turn."""
    speaker = serializers.ChoiceField(choices=Transcript.Speaker.choices)
    text = serializers.CharField(allow_blank=True)
    sequence_number = serializers.IntegerField(min_value=0)
    timestamp = serializers.DateTimeField(required=False, allow_null=True)
    question_id = serializers.UUIDField(required=False, allow_null=True)
    is_followup = serializers.BooleanField(default=False)
    latency_ms = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    confidence = serializers.FloatField(required=False, allow_null=True, min_value=0.0, max_value=1.0)


class HumanVerdictSerializer(serializers.ModelSerializer):
    """Allows a recruiter to record their verdict on a brief."""

    class Meta:
        model = InterviewBrief
        fields = ("human_verdict", "human_notes")