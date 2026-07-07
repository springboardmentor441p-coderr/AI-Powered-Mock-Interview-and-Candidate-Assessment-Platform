from django.contrib import admin

from apps.resume.models import ExtractedSkill, Resume


class ExtractedSkillInline(admin.TabularInline):
    model = ExtractedSkill
    extra = 0
    readonly_fields = ("name", "category", "confidence")
    can_delete = False


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ("original_filename", "candidate", "status", "is_primary", "experience_years", "created_at")
    list_filter = ("status", "is_primary")
    search_fields = ("original_filename", "candidate__email")
    readonly_fields = ("id", "raw_text", "created_at", "updated_at")
    inlines = [ExtractedSkillInline]
