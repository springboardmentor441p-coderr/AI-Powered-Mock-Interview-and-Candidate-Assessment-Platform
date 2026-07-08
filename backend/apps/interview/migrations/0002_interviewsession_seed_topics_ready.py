# Generated migration: add seed_topics_ready flag to InterviewSession

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("interview", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="interviewsession",
            name="seed_topics_ready",
            field=models.BooleanField(
                default=False,
                db_index=True,
                help_text=(
                    "True once SeedTopicService (via Celery) has generated and stored "
                    "the resume-aware seed topics for this realtime session. "
                    "The frontend should poll this before enabling Start Interview."
                ),
            ),
        ),
    ]