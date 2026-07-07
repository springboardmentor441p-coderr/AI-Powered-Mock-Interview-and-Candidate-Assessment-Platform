from abc import ABC, abstractmethod


class ITechnicalStrategy(ABC):
    @abstractmethod
    def calculate(self, *, session, analysis) -> float:
        ...


class TechnicalStrategy(ITechnicalStrategy):
    def calculate(self, *, session, analysis) -> float:
        from apps.interview.models import InterviewSession, Question

        transcript_lower = (analysis.transcript or "").lower()

        if session.mode == InterviewSession.Mode.REALTIME:
            # Realtime sessions never populate `answers` - topics live on
            # `session.seed_topics` instead, pulled live by
            # InterviewOrchestrator as the conversation unfolds.
            expected: set[str] = set()
            for topic in session.seed_topics.all():
                if topic.expected_topics:
                    expected.update(t.lower() for t in topic.expected_topics)
            total = session.seed_topics.count()
            answered_ratio = (
                session.seed_topics.filter(status=Question.Status.ASKED).count() / total if total else 0.0
            )
        else:
            expected = set()
            for answer in session.answers.all():
                if answer.question and answer.question.expected_topics:
                    expected.update(t.lower() for t in answer.question.expected_topics)
            total = session.answers.count()
            answered_ratio = session.answers.filter(answered_at__isnull=False).count() / total if total else 0.0

        keyword_coverage = (
            sum(1 for t in expected if t in transcript_lower) / len(expected) if expected else 0.6
        )
        completeness = (analysis.completeness_score or 0) / 100.0
        raw = (keyword_coverage * 0.50 + completeness * 0.30 + answered_ratio * 0.20) * 100
        return round(max(0.0, min(100.0, raw)), 2)
