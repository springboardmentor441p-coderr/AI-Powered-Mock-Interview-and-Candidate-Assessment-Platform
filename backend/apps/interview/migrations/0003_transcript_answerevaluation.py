# Generated migration: add Transcript, ThreadEvaluation, and InterviewBrief tables.

import django.db.models.deletion
import uuid

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("interview", "0002_interviewsession_seed_topics_ready"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # ------------------------------------------------------------------
        # Transcript
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name="Transcript",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("speaker", models.CharField(choices=[("assistant", "AI Interviewer"), ("candidate", "Candidate")], max_length=12)),
                ("text", models.TextField()),
                ("sequence_number", models.PositiveIntegerField()),
                ("timestamp", models.DateTimeField(blank=True, null=True)),
                ("is_followup", models.BooleanField(default=False)),
                ("latency_ms", models.PositiveIntegerField(blank=True, null=True)),
                ("confidence", models.FloatField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("interview", models.ForeignKey(db_index=True, on_delete=django.db.models.deletion.CASCADE, related_name="transcript_turns", to="interview.interviewsession")),
                ("question", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="transcript_turns", to="interview.question")),
            ],
            options={"db_table": "interview_transcripts", "ordering": ["sequence_number"]},
        ),
        migrations.AddIndex(
            model_name="transcript",
            index=models.Index(fields=["interview", "sequence_number"], name="transcript_interview_seq_idx"),
        ),
        migrations.AddIndex(
            model_name="transcript",
            index=models.Index(fields=["interview", "speaker"], name="transcript_interview_speaker_idx"),
        ),
        migrations.AlterUniqueTogether(
            name="transcript",
            unique_together={("interview", "sequence_number")},
        ),
        # ------------------------------------------------------------------
        # ThreadEvaluation
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name="ThreadEvaluation",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("depth_under_pressure", models.FloatField(blank=True, null=True)),
                ("conceptual_accuracy", models.FloatField(blank=True, null=True)),
                ("specificity", models.FloatField(blank=True, null=True)),
                ("recovery", models.FloatField(blank=True, null=True)),
                ("overall_score", models.FloatField(blank=True, null=True)),
                ("verdict", models.CharField(
                    choices=[("strong","Strong"),("surface","Surface-level"),("bluffing","Possible bluffing"),("weak","Weak"),("insufficient","Insufficient data")],
                    default="insufficient", max_length=14,
                )),
                ("red_flags", models.JSONField(default=list)),
                ("strong_signals", models.JSONField(default=list)),
                ("suggested_followups", models.JSONField(default=list)),
                ("requires_human_review", models.BooleanField(default=False)),
                ("human_review_reason", models.TextField(blank=True)),
                ("turn_count", models.PositiveSmallIntegerField(default=0)),
                ("candidate_turn_count", models.PositiveSmallIntegerField(default=0)),
                ("model_used", models.CharField(blank=True, default="", max_length=80)),
                ("raw_response", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("interview", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="thread_evaluations", to="interview.interviewsession")),
                ("seed_topic", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="thread_evaluation", to="interview.question")),
            ],
            options={"db_table": "interview_thread_evaluations", "ordering": ["seed_topic__order"]},
        ),
        migrations.AddIndex(
            model_name="threadevaluation",
            index=models.Index(fields=["interview"], name="threadevaluation_interview_idx"),
        ),
        # ------------------------------------------------------------------
        # InterviewBrief
        # ------------------------------------------------------------------
        migrations.CreateModel(
            name="InterviewBrief",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("overall_signal", models.CharField(
                    blank=True, null=True, max_length=14,
                    choices=[("strong","Strong across topics"),("mixed","Mixed"),("surface","Surface-level throughout"),("inconsistent","Inconsistent")],
                )),
                ("summary", models.TextField(blank=True)),
                ("performs_under_pressure", models.BooleanField(null=True)),
                ("specificity_consistent", models.BooleanField(null=True)),
                ("self_contradictions_detected", models.BooleanField(default=False)),
                ("contradiction_detail", models.TextField(blank=True)),
                ("red_flags", models.JSONField(default=list)),
                ("strong_signals", models.JSONField(default=list)),
                ("suggested_followup_questions", models.JSONField(default=list)),
                ("requires_human_review", models.BooleanField(default=False)),
                ("human_verdict", models.CharField(blank=True, null=True, max_length=10,
                    choices=[("advance","Advance"),("reject","Reject"),("hold","Hold")])),
                ("human_notes", models.TextField(blank=True)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("model_used", models.CharField(blank=True, default="", max_length=80)),
                ("raw_response", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("interview", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="brief", to="interview.interviewsession")),
                ("reviewed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reviewed_briefs", to=settings.AUTH_USER_MODEL)),
            ],
            options={"db_table": "interview_briefs"},
        ),
    ]