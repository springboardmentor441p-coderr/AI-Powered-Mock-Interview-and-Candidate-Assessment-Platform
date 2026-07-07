from django.contrib import admin
from apps.assessment.models import FinalScore, SpeechAnalysis
from apps.assessment.models.session_feedback import SessionFeedback


@admin.register(SpeechAnalysis)
class SpeechAnalysisAdmin(admin.ModelAdmin):
    list_display = ("session", "status", "dominant_emotion", "confidence_score")
    list_filter = ("status",)
    search_fields = ("session__candidate__email",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(FinalScore)
class FinalScoreAdmin(admin.ModelAdmin):
    list_display = ("session", "overall", "rating", "communication", "confidence")
    list_filter = ("rating",)
    search_fields = ("session__candidate__email",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(SessionFeedback)
class SessionFeedbackAdmin(admin.ModelAdmin):
    list_display = ("session", "created_at")
    search_fields = ("session__candidate__email",)
    readonly_fields = ("id", "created_at", "updated_at")
