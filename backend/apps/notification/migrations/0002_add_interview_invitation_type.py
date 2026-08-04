from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("notification", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="notification",
            name="notification_type",
            field=models.CharField(
                choices=[
                    ("interview_reminder", "Interview Reminder"),
                    ("session_completed", "Session Completed"),
                    ("report_ready", "Report Ready"),
                    ("system_alert", "System Alert"),
                    ("interview_invitation", "Interview Invitation"),
                ],
                max_length=30,
            ),
        ),
    ]