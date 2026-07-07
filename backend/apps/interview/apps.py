from django.apps import AppConfig


class InterviewConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.interview"
    label = "interview"
    verbose_name = "Interviews"
