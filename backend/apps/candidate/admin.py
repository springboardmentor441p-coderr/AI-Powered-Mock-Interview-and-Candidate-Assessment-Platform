from django.contrib import admin

from apps.candidate.models import CandidateProfile


@admin.register(CandidateProfile)
class CandidateProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "headline", "target_role", "experience_level", "created_at")
    search_fields = ("user__email", "headline", "target_role")
    list_filter = ("experience_level",)
    readonly_fields = ("id", "created_at", "updated_at")
