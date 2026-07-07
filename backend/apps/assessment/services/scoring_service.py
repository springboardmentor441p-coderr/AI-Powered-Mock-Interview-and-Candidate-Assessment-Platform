from django.db import transaction

from core.exceptions import NotFoundError
from core.services import BaseService

from apps.assessment.models import FinalScore, PerformanceRating, SpeechAnalysis
from apps.assessment.strategies import (
    CommunicationStrategy,
    ConfidenceStrategy,
    ICommunicationStrategy,
    IConfidenceStrategy,
    IProfessionalismStrategy,
    ITechnicalStrategy,
    ProfessionalismStrategy,
    TechnicalStrategy,
)

_WEIGHTS = {"communication": 0.30, "confidence": 0.25, "technical_relevance": 0.30, "professionalism": 0.15}

_RATING_THRESHOLDS = (
    (90, PerformanceRating.EXCELLENT),
    (75, PerformanceRating.GOOD),
    (60, PerformanceRating.AVERAGE),
    (40, PerformanceRating.NEEDS_IMPROVEMENT),
)


def rating_for_score(score: float) -> str:
    for threshold, rating in _RATING_THRESHOLDS:
        if score >= threshold:
            return rating
    return PerformanceRating.POOR


class ScoringService(BaseService):
    """
    Aggregates the four rubric category scores into the overall weighted
    score. Each category is computed by its injected `IXxxStrategy`,
    keeping aggregation logic entirely separate from scoring logic
    (Strategy + Dependency Inversion).
    """

    def __init__(
        self,
        communication_strategy: ICommunicationStrategy | None = None,
        confidence_strategy: IConfidenceStrategy | None = None,
        technical_strategy: ITechnicalStrategy | None = None,
        professionalism_strategy: IProfessionalismStrategy | None = None,
    ):
        super().__init__()
        self._comm = communication_strategy or CommunicationStrategy()
        self._conf = confidence_strategy or ConfidenceStrategy()
        self._tech = technical_strategy or TechnicalStrategy()
        self._prof = professionalism_strategy or ProfessionalismStrategy()

    @transaction.atomic
    def score_session(self, *, session) -> FinalScore:
        try:
            analysis = session.speech_analysis
        except SpeechAnalysis.DoesNotExist:
            raise NotFoundError("Speech analysis for this session has not been generated yet.")

        comm = self._comm.calculate(analysis=analysis)
        conf = self._conf.calculate(analysis=analysis)
        tech = self._tech.calculate(session=session, analysis=analysis)
        prof = self._prof.calculate(session=session, analysis=analysis)

        overall = round(
            comm * _WEIGHTS["communication"]
            + conf * _WEIGHTS["confidence"]
            + tech * _WEIGHTS["technical_relevance"]
            + prof * _WEIGHTS["professionalism"],
            2,
        )

        final, _ = FinalScore.objects.update_or_create(
            session=session,
            defaults={
                "communication": comm, "confidence": conf,
                "technical_relevance": tech, "professionalism": prof,
                "overall": overall, "rating": rating_for_score(overall),
                "breakdown": {"weights": _WEIGHTS, "categories": {
                    "communication": comm, "confidence": conf,
                    "technical_relevance": tech, "professionalism": prof,
                }},
            },
        )
        self.logger.info("Scored session %s: overall=%.2f (%s)", session.id, overall, final.rating)
        return final
