from abc import ABC, abstractmethod


class IProfessionalismStrategy(ABC):
    @abstractmethod
    def calculate(self, *, session, analysis) -> float:
        ...


class ProfessionalismStrategy(IProfessionalismStrategy):
    def calculate(self, *, session, analysis) -> float:
        if session.duration_seconds and session.template:
            expected = session.template.duration_minutes * 60
            ratio = session.duration_seconds / expected if expected else 1.0
            time_score = 100.0 if 0.7 <= ratio <= 1.2 else max(0.0, 100 - abs(ratio - 1.0) * 100)
        else:
            time_score = 70.0
        filler_penalty = min(15.0, (analysis.filler_word_count or 0) * 1.5)
        raw = (time_score * 0.40) + ((analysis.clarity_score or 70.0) * 0.60) - filler_penalty
        return round(max(0.0, min(100.0, raw)), 2)
