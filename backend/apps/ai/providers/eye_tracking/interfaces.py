"""Eye-tracking AI port: gaze / attention / engagement contract."""
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class EyeContactResult:
    eye_contact_percentage: float
    attention_score: float
    engagement_score: float


class IEyeContactTrackingProvider(ABC):
    @abstractmethod
    def analyze(self, video_file_path: str) -> EyeContactResult:
        ...
