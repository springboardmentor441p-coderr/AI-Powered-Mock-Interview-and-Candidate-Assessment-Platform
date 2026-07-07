from abc import ABC, abstractmethod


class ICommunicationStrategy(ABC):
    @abstractmethod
    def calculate(self, *, analysis) -> float:
        ...


class CommunicationStrategy(ICommunicationStrategy):
    def calculate(self, *, analysis) -> float:
        filler_penalty = min(20.0, (analysis.filler_word_count or 0) * 2)
        pace = analysis.speaking_pace_wpm or 0.0
        pace_score = 100.0 if 110 <= pace <= 160 else max(0.0, 100 - abs(pace - 135) * 0.8)
        raw = (
            (analysis.grammar_score or 0) * 0.30
            + (analysis.clarity_score or 0) * 0.25
            + (analysis.completeness_score or 0) * 0.25
            + pace_score * 0.20
        )
        return round(max(0.0, min(100.0, raw - filler_penalty)), 2)
