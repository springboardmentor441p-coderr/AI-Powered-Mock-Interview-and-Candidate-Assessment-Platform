from apps.ai.providers.emotion.interfaces import EmotionAnalysisResult, IEmotionDetectionProvider
from apps.ai.providers.shared import seeded_random

_EMOTIONS = ("confident", "neutral", "nervous", "happy", "focused")


class MockEmotionDetectionProvider(IEmotionDetectionProvider):
    """
    Stand-in for a DeepFace/CNN-based emotion pipeline. Produces a
    deterministic-but-plausible emotion breakdown so the rest of the
    scoring pipeline can be developed/tested without GPU dependencies.
    """

    def analyze(self, video_file_path: str) -> EmotionAnalysisResult:
        rng = seeded_random(video_file_path)
        raw_scores = {emotion: rng.uniform(0.05, 1.0) for emotion in _EMOTIONS}
        total = sum(raw_scores.values())
        breakdown = {k: round(v / total * 100, 2) for k, v in raw_scores.items()}
        dominant = max(breakdown, key=lambda k: breakdown[k])
        confidence_score = round(breakdown.get("confident", 0) + breakdown.get("focused", 0) * 0.5, 2)
        return EmotionAnalysisResult(
            dominant_emotion=dominant,
            emotion_breakdown=breakdown,
            confidence_score=min(100.0, confidence_score),
        )
