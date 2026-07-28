import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("assessment", "0002_initial"),
        ("interview", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="FaceAssessmentSnapshot",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("session", models.ForeignKey(
                    db_index=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="face_snapshots",
                    to="interview.interviewsession",
                )),
                ("sequence", models.PositiveIntegerField(
                    help_text="Client-assigned monotonically increasing counter per session."
                )),
                ("face_detected", models.BooleanField(default=True)),
                ("gaze_on_screen", models.BooleanField(default=True)),
                ("eye_contact_score", models.FloatField()),
                ("attention_score", models.FloatField()),
                ("engagement_score", models.FloatField()),
                ("dominant_emotion", models.CharField(blank=True, default="neutral", max_length=30)),
                ("emotion_breakdown", models.JSONField(
                    blank=True,
                    default=dict,
                    help_text="{'happy': 0.6, 'neutral': 0.3, ...}",
                )),
                ("emotion_confidence", models.FloatField(default=0.0)),
                ("yaw", models.FloatField(default=0.0, help_text="Left/right head rotation in degrees.")),
                ("pitch", models.FloatField(default=0.0, help_text="Up/down head rotation in degrees.")),
                ("roll", models.FloatField(default=0.0, help_text="Head tilt in degrees.")),
                ("captured_at", models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                "db_table": "face_assessment_snapshots",
                "ordering": ["sequence"],
            },
        ),
        migrations.AddConstraint(
            model_name="faceassessmentsnapshot",
            constraint=models.UniqueConstraint(
                fields=("session", "sequence"),
                name="unique_face_snapshot_per_session_seq",
            ),
        ),
    ]