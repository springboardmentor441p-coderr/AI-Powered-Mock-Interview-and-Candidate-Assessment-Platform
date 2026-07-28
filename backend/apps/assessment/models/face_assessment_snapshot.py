"""
FaceAssessmentSnapshot — stores periodic real-time face analysis readings
sent from the browser during a live interview.

Each row is a ~2-second window of aggregated MediaPipe FaceLandmarker data.
At session completion, the SpeechAnalysisService aggregates these rows to
populate SpeechAnalysis.{eye_contact_percentage, attention_score,
engagement_score, confidence_score, dominant_emotion, emotion_breakdown}.
"""
import uuid
from django.db import models


class FaceAssessmentSnapshot(models.Model):
    """One periodic sample of face assessment data from the browser client."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(
        "interview.InterviewSession",
        on_delete=models.CASCADE,
        related_name="face_snapshots",
        db_index=True,
    )
    session_id: uuid.UUID
    sequence = models.PositiveIntegerField(
        help_text="Client-assigned monotonically increasing counter per session."
    )

    # Presence / attention
    face_detected = models.BooleanField(default=True)
    multiple_faces_detected = models.BooleanField(default=False)
    gaze_on_screen = models.BooleanField(default=True)

    # Derived scores (0–100)
    eye_contact_score = models.FloatField()
    attention_score = models.FloatField()
    engagement_score = models.FloatField()

    # Emotion (heuristic from face landmarks)
    dominant_emotion = models.CharField(max_length=30, blank=True, default="neutral")
    emotion_breakdown = models.JSONField(
        default=dict,
        blank=True,
        help_text="{'happy': 0.6, 'neutral': 0.3, ...}",
    )
    emotion_confidence = models.FloatField(default=0.0)

    # Head pose (degrees)
    yaw = models.FloatField(default=0.0, help_text="Left/right head rotation in degrees.")
    pitch = models.FloatField(default=0.0, help_text="Up/down head rotation in degrees.")
    roll = models.FloatField(default=0.0, help_text="Head tilt in degrees.")

    captured_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        app_label = "assessment"
        db_table = "face_assessment_snapshots"
        ordering = ["sequence"]
        unique_together = [("session", "sequence")]

    def __str__(self) -> str:
        return f"FaceSnapshot(session={self.session_id}, seq={self.sequence})"