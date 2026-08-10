"""
models/training.py — TrainingDataPoint
Stores every (question, answer, scores) row for ML model training.
The ML model learns from these rows to predict scores for new answers.
"""
from datetime import datetime
from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class TrainingDataPoint(Base):
    """
    One training row = one question + candidate answer + verified scores.
    The ML model is trained on these rows.
    Human reviewers or GPT-verified scores are stored here.
    """
    __tablename__ = "training_data"

    id:              Mapped[int]   = mapped_column(primary_key=True, index=True)
    session_id:      Mapped[int]   = mapped_column(Integer, index=True)
    question_text:   Mapped[str]   = mapped_column(Text)
    answer_text:     Mapped[str]   = mapped_column(Text)
    interview_type:  Mapped[str]   = mapped_column(String(50))
    domain:          Mapped[str]   = mapped_column(String(100))
    difficulty:      Mapped[str]   = mapped_column(String(20))

    # Target labels for training (0-100 each)
    communication_score:   Mapped[float] = mapped_column(Float)
    technical_score:       Mapped[float] = mapped_column(Float)
    confidence_score:      Mapped[float] = mapped_column(Float)
    professionalism_score: Mapped[float] = mapped_column(Float)
    overall_score:         Mapped[float] = mapped_column(Float)

    # Feature signals
    word_count:        Mapped[int]   = mapped_column(Integer, default=0)
    filler_word_count: Mapped[int]   = mapped_column(Integer, default=0)
    words_per_minute:  Mapped[float] = mapped_column(Float, default=0)
    answer_duration:   Mapped[float] = mapped_column(Float, default=0)

    # Source: "gpt_evaluated" | "human_reviewed" | "auto"
    source:     Mapped[str]      = mapped_column(String(30), default="gpt_evaluated")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "question_text": self.question_text,
            "answer_text": self.answer_text,
            "interview_type": self.interview_type,
            "domain": self.domain,
            "difficulty": self.difficulty,
            "communication_score": self.communication_score,
            "technical_score": self.technical_score,
            "confidence_score": self.confidence_score,
            "professionalism_score": self.professionalism_score,
            "overall_score": self.overall_score,
            "word_count": self.word_count,
            "filler_word_count": self.filler_word_count,
            "words_per_minute": self.words_per_minute,
        }
