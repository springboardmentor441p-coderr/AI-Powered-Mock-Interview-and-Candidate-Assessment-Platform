from apps.ai.providers.emotion.interfaces import EmotionAnalysisResult, IEmotionDetectionProvider
from core.exceptions import ExternalServiceError


class DeepFaceEmotionDetectionProvider(IEmotionDetectionProvider):
    """
    Adapter around DeepFace's CNN-based facial emotion recognition.
    Samples frames from the recorded interview video and averages the
    per-frame emotion probabilities.
    """

    def analyze(self, video_file_path: str) -> EmotionAnalysisResult:
        try:
            import cv2
            from deepface import DeepFace
        except ImportError as exc:
            raise ExternalServiceError("opencv-python / deepface are not installed.") from exc

        try:
            capture = cv2.VideoCapture(video_file_path)
            frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
            sample_indices = sorted(set(int(frame_count * p) for p in (0.1, 0.3, 0.5, 0.7, 0.9)))
            aggregated: dict[str, float] = {}
            sampled = 0

            for idx in sample_indices:
                capture.set(cv2.CAP_PROP_POS_FRAMES, idx)
                ok, frame = capture.read()
                if not ok:
                    continue
                analysis = DeepFace.analyze(frame, actions=["emotion"], enforce_detection=False)
                result = analysis[0] if isinstance(analysis, list) else analysis
                for emotion, score in result["emotion"].items():
                    aggregated[emotion] = aggregated.get(emotion, 0.0) + score
                sampled += 1
            capture.release()

            if sampled == 0:
                raise ExternalServiceError("No frames could be sampled from the recording.")

            breakdown = {k: round(v / sampled, 2) for k, v in aggregated.items()}
            dominant = max(breakdown, key=lambda k: breakdown[k])
            confidence_score = round(breakdown.get("happy", 0) + breakdown.get("neutral", 0) * 0.5, 2)
            return EmotionAnalysisResult(
                dominant_emotion=dominant, emotion_breakdown=breakdown, confidence_score=min(100.0, confidence_score)
            )
        except ExternalServiceError:
            raise
        except Exception as exc:  # noqa: BLE001
            raise ExternalServiceError("Emotion detection failed.", details={"reason": str(exc)}) from exc
