from rest_framework import serializers

from apps.interview.models import (
    Answer, ConversationTurn, Difficulty, InterviewSession, InterviewTemplate, InterviewType,
)


class InterviewTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewTemplate
        fields = ("id", "title", "description", "interview_type", "domain",
                  "difficulty", "question_count", "duration_minutes", "is_active", "created_at")
        read_only_fields = ("id", "created_at")


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ("id", "question_text", "order", "answer_text",
                  "answer_audio", "answer_video", "response_time_seconds", "answered_at")
        read_only_fields = ("id", "question_text", "order", "answered_at")


class InterviewSessionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewSession
        fields = ("id", "mode", "interview_type", "domain", "difficulty", "status",
                  "started_at", "completed_at", "duration_seconds", "created_at")
        read_only_fields = fields


class InterviewSessionDetailSerializer(serializers.ModelSerializer):
    answers = serializers.SerializerMethodField()

    class Meta:
        model = InterviewSession
        fields = ("id", "mode", "interview_type", "domain", "difficulty", "status",
                  "started_at", "completed_at", "duration_seconds",
                  "video_recording", "audio_recording", "answers", "created_at")
        read_only_fields = fields

    def get_answers(self, obj):
        return AnswerSerializer(obj.answers.order_by("order"), many=True).data


class ConversationTurnSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConversationTurn
        fields = ("id", "speaker", "turn_type", "text", "order",
                  "started_at_ms", "ended_at_ms", "was_interrupted", "created_at")
        read_only_fields = fields


class RealtimeSessionDetailSerializer(serializers.ModelSerializer):
    """
    Detail view for realtime-mode sessions: conversation turns instead of fixed answers.

    Extra fields for seed topic status:
      - seed_topics_ready: bool — True once the Celery task has finished generating topics.
                            Frontend should poll this before enabling "Start Interview".
      - seed_topics_count: int  — How many seed topics are stored (pending + asked combined).
    """
    turns = serializers.SerializerMethodField()
    seed_topics_count = serializers.SerializerMethodField()

    class Meta:
        model = InterviewSession
        fields = (
            "id", "mode", "interview_type", "domain", "difficulty", "status",
            "call_id", "call_join_url", "interrupt_count",
            "seed_topics_ready", "seed_topics_count",
            "started_at", "completed_at", "duration_seconds", "turns", "created_at",
        )
        read_only_fields = fields

    def get_turns(self, obj):
        return ConversationTurnSerializer(obj.turns.order_by("order"), many=True).data

    def get_seed_topics_count(self, obj) -> int:
        return obj.seed_topics.count()  # type: ignore[attr-defined]


class CreateSessionSerializer(serializers.Serializer):
    interview_type = serializers.ChoiceField(choices=InterviewType.choices)
    domain = serializers.CharField(max_length=120)
    difficulty = serializers.ChoiceField(choices=Difficulty.choices, default=Difficulty.MEDIUM)
    question_count = serializers.IntegerField(min_value=1, max_value=20, default=5)
    template_id = serializers.UUIDField(required=False, allow_null=True)
    use_primary_resume = serializers.BooleanField(default=True)


class CreateRealtimeSessionSerializer(serializers.Serializer):
    interview_type = serializers.ChoiceField(choices=InterviewType.choices)
    domain = serializers.CharField(max_length=120)
    difficulty = serializers.ChoiceField(choices=Difficulty.choices, default=Difficulty.MEDIUM)
    topic_count = serializers.IntegerField(min_value=1, max_value=15, default=6)
    template_id = serializers.UUIDField(required=False, allow_null=True)
    use_primary_resume = serializers.BooleanField(default=True)


class SubmitAnswerSerializer(serializers.Serializer):
    question_order = serializers.IntegerField(min_value=0)
    answer_text = serializers.CharField(required=False, allow_blank=True, default="")
    answer_audio = serializers.FileField(required=False, allow_null=True)
    answer_video = serializers.FileField(required=False, allow_null=True)
    response_time_seconds = serializers.FloatField(required=False, allow_null=True)


class AppendTranscriptTurnSerializer(serializers.Serializer):
    """
    Posted by the frontend as it observes finalized turns via the
    Ultravox client SDK's transcript events (and when it detects the
    candidate barged in on the AI mid-sentence).
    """
    speaker = serializers.ChoiceField(choices=ConversationTurn.Speaker.choices)
    text = serializers.CharField(allow_blank=True)
    turn_type = serializers.ChoiceField(choices=ConversationTurn.TurnType.choices, default=ConversationTurn.TurnType.ANSWER)
    started_at_ms = serializers.IntegerField(required=False, allow_null=True)
    ended_at_ms = serializers.IntegerField(required=False, allow_null=True)
    was_interrupted = serializers.BooleanField(default=False)