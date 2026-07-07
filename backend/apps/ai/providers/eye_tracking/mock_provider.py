import os

from apps.ai.providers.eye_tracking.interfaces import EyeContactResult, IEyeContactTrackingProvider
from apps.ai.providers.shared import seeded_random


class MockEyeContactTrackingProvider(IEyeContactTrackingProvider):
    """Stand-in for a MediaPipe/OpenCV-based gaze and attention tracker."""

    def analyze(self, video_file_path: str) -> EyeContactResult:
        rng = seeded_random((video_file_path or "") + "eyes")
        exists = bool(video_file_path) and os.path.exists(video_file_path)
        base = 78.0 if exists else 60.0
        eye_contact_percentage = round(min(100.0, max(0.0, base + rng.uniform(-15, 15))), 2)
        attention_score = round(min(100.0, max(0.0, eye_contact_percentage + rng.uniform(-5, 5))), 2)
        engagement_score = round(min(100.0, max(0.0, (eye_contact_percentage + attention_score) / 2)), 2)
        return EyeContactResult(
            eye_contact_percentage=eye_contact_percentage,
            attention_score=attention_score,
            engagement_score=engagement_score,
        )
