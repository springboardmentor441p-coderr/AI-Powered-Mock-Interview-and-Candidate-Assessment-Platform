from django.contrib import admin

from apps.interview.models import (
    Answer, ConversationTurn, InterviewSession, InterviewTemplate, Question, RealtimeEventLog,
)


class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 0
    readonly_fields = ("question_text", "order", "answered_at")
    can_delete = False


class ConversationTurnInline(admin.TabularInline):
    model = ConversationTurn
    extra = 0
    readonly_fields = ("speaker", "turn_type", "text", "order", "was_interrupted", "created_at")
    can_delete = False


@admin.register(RealtimeEventLog)
class RealtimeEventLogAdmin(admin.ModelAdmin):
    list_display = ("session", "provider", "event_type", "created_at")
    list_filter = ("provider", "event_type")
    readonly_fields = ("id", "session", "provider", "event_type", "payload", "created_at")


@admin.register(InterviewTemplate)
class InterviewTemplateAdmin(admin.ModelAdmin):
    list_display = ("title", "interview_type", "domain", "difficulty", "question_count", "is_active")
    list_filter = ("interview_type", "difficulty", "is_active")
    search_fields = ("title", "domain")


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("__str__", "category", "difficulty", "is_ai_generated")
    list_filter = ("category", "difficulty", "is_ai_generated")


@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "candidate", "interview_type", "mode", "status", "started_at", "completed_at")
    list_filter = ("status", "mode", "interview_type")
    search_fields = ("candidate__email", "call_id")
    inlines = [AnswerInline, ConversationTurnInline]
    readonly_fields = ("id", "created_at", "updated_at", "call_id", "call_join_url")
