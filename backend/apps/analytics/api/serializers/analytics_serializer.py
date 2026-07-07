from rest_framework import serializers


class PerformanceSummarySerializer(serializers.Serializer):
    average_overall = serializers.FloatField(allow_null=True)
    average_communication = serializers.FloatField(allow_null=True)
    average_confidence = serializers.FloatField(allow_null=True)
    average_technical = serializers.FloatField(allow_null=True)
    average_professionalism = serializers.FloatField(allow_null=True)
    best_score = serializers.FloatField(allow_null=True)
    total_sessions = serializers.IntegerField()


class ScoreTrendPointSerializer(serializers.Serializer):
    session_id = serializers.CharField()
    overall_score = serializers.FloatField()
    rating = serializers.CharField()
    interview_type = serializers.CharField()
    date = serializers.DateTimeField()


class CandidateRankingSerializer(serializers.Serializer):
    candidate_id = serializers.CharField()
    email = serializers.EmailField()
    name = serializers.CharField()
    average_score = serializers.FloatField()
    sessions_completed = serializers.IntegerField()
