"""Emotion AI port: facial emotion / confidence detection contract."""
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class EmotionAnalysisResult:
    dominant_emotion: str
    emotion_breakdown: dict[str, float]
    confidence_score: float


class IEmotionDetectionProvider(ABC):
    @abstractmethod
    def analyze(self, video_file_path: str) -> EmotionAnalysisResult:
        ...
