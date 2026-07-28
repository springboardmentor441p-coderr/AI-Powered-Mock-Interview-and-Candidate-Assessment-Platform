from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("assessment", "0003_face_assessment_snapshot"),
    ]

    operations = [
        migrations.AddField(
            model_name="faceassessmentsnapshot",
            name="multiple_faces_detected",
            field=models.BooleanField(default=False),
        ),
    ]