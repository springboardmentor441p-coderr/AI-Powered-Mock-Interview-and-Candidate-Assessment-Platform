from abc import ABC, abstractmethod


class IConfidenceStrategy(ABC):
    @abstractmethod
    def calculate(self, *, analysis) -> float:
        ...


class ConfidenceStrategy(IConfidenceStrategy):
    def calculate(self, *, analysis) -> float:
        raw = (
            (analysis.eye_contact_percentage or 0) * 0.30
            + (analysis.attention_score or 0) * 0.25
            + (analysis.engagement_score or 0) * 0.20
            + (analysis.confidence_score or 0) * 0.25
        )
        return round(max(0.0, min(100.0, raw)), 2)
