from django.contrib import admin

from apps.interview.models import (
    Answer, ConversationTurn, InterviewBrief, InterviewSession,
    InterviewTemplate, Question, RealtimeEventLog, ThreadEvaluation, Transcript,
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


class TranscriptInline(admin.TabularInline):
    model = Transcript
    extra = 0
    readonly_fields = ("sequence_number", "speaker", "text", "is_followup", "latency_ms", "confidence", "created_at")
    can_delete = False
    ordering = ("sequence_number",)
    show_change_link = True


class ThreadEvaluationInline(admin.TabularInline):
    model = ThreadEvaluation
    extra = 0
    readonly_fields = ("seed_topic", "verdict", "overall_score", "depth_under_pressure",
                       "conceptual_accuracy", "specificity", "recovery",
                       "requires_human_review", "created_at")
    can_delete = False
    show_change_link = True


class InterviewBriefInline(admin.StackedInline):
    model = InterviewBrief
    extra = 0
    readonly_fields = (
        "overall_signal", "summary", "performs_under_pressure", "specificity_consistent",
        "self_contradictions_detected", "contradiction_detail",
        "red_flags", "strong_signals", "suggested_followup_questions",
        "requires_human_review", "human_verdict", "human_notes",
        "reviewed_by", "reviewed_at", "model_used", "created_at",
    )
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
    list_display = ("__str__", "category", "difficulty", "is_ai_generated", "status")
    list_filter = ("category", "difficulty", "is_ai_generated", "status")


@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "candidate", "interview_type", "mode", "status", "started_at", "completed_at")
    list_filter = ("status", "mode", "interview_type")
    search_fields = ("candidate__email", "call_id")
    inlines = [AnswerInline, ConversationTurnInline, TranscriptInline, ThreadEvaluationInline, InterviewBriefInline]
    readonly_fields = ("id", "created_at", "updated_at", "call_id", "call_join_url")


@admin.register(Transcript)
class TranscriptAdmin(admin.ModelAdmin):
    list_display = ("sequence_number", "interview", "speaker", "is_followup", "confidence", "created_at")
    list_filter = ("speaker", "is_followup")
    search_fields = ("interview__id", "text")
    readonly_fields = (
        "id", "interview", "speaker", "text", "sequence_number", "timestamp",
        "question", "is_followup", "latency_ms", "confidence", "created_at",
    )
    ordering = ("interview", "sequence_number")


@admin.register(ThreadEvaluation)
class ThreadEvaluationAdmin(admin.ModelAdmin):
    list_display = (
        "interview", "seed_topic", "verdict", "overall_score",
        "depth_under_pressure", "conceptual_accuracy", "specificity",
        "requires_human_review", "created_at",
    )
    list_filter = ("verdict", "requires_human_review")
    search_fields = ("interview__id", "seed_topic__text")
    readonly_fields = (
        "id", "interview", "seed_topic",
        "depth_under_pressure", "conceptual_accuracy", "specificity", "recovery",
        "overall_score", "verdict",
        "red_flags", "strong_signals", "suggested_followups",
        "requires_human_review", "human_review_reason",
        "turn_count", "candidate_turn_count",
        "model_used", "raw_response", "created_at", "updated_at",
    )


@admin.register(InterviewBrief)
class InterviewBriefAdmin(admin.ModelAdmin):
    list_display = (
        "interview", "overall_signal", "performs_under_pressure",
        "self_contradictions_detected", "requires_human_review",
        "human_verdict", "reviewed_by", "created_at",
    )
    list_filter = ("overall_signal", "human_verdict", "requires_human_review", "self_contradictions_detected")
    search_fields = ("interview__id",)
    readonly_fields = (
        "id", "interview",
        "overall_signal", "summary",
        "performs_under_pressure", "specificity_consistent",
        "self_contradictions_detected", "contradiction_detail",
        "red_flags", "strong_signals", "suggested_followup_questions",
        "requires_human_review",
        "model_used", "raw_response", "created_at", "updated_at",
    )
    # Human-editable fields
    fields = (
        "id", "interview",
        "overall_signal", "summary",
        "performs_under_pressure", "specificity_consistent",
        "self_contradictions_detected", "contradiction_detail",
        "red_flags", "strong_signals", "suggested_followup_questions",
        "requires_human_review",
        # Human verdict section
        "human_verdict", "human_notes", "reviewed_by", "reviewed_at",
        "model_used", "raw_response", "created_at", "updated_at",
    )