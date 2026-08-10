"""
ml/data_collector.py — Collect training data from completed interview sessions

After each interview session ends:
  1. We have: question, answer, GPT scores
  2. We save this row to training_data table in DB
  3. We also export CSV so the train script can read it

Run this after enough sessions have accumulated (e.g. 100+ rows)
to re-train or fine-tune the scoring model.
"""
import os
import csv
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import select

from backend.database import engine
from backend.models.training import TrainingDataPoint
from backend.models.session import InterviewAnswer, InterviewQuestion, InterviewSession

EXPORT_PATH = Path(__file__).parent / "training_data" / "interview_data.csv"


def collect_from_session(session_id: int) -> int:
    """
    Pull all Q&A pairs from a completed session and save to training_data table.
    Returns number of rows saved.
    """
    rows_saved = 0
    with Session(engine) as db:
        # get session info
        sess = db.scalar(select(InterviewSession).where(InterviewSession.id == session_id))
        if not sess:
            return 0

        # get all questions for this session
        questions = db.scalars(
            select(InterviewQuestion).where(InterviewQuestion.session_id == session_id)
        ).all()

        for q in questions:
            if not q.answer:
                continue
            a = q.answer

            # calculate overall from the per-answer scores
            overall = (
                a.communication_score   * 0.30 +
                a.confidence_score      * 0.25 +
                a.technical_score       * 0.30 +
                a.professionalism_score * 0.15
            )

            point = TrainingDataPoint(
                session_id         = session_id,
                question_text      = q.question_text,
                answer_text        = a.transcribed_text,
                interview_type     = sess.interview_type,
                domain             = sess.domain,
                difficulty         = sess.difficulty,
                communication_score   = a.communication_score,
                technical_score       = a.technical_score,
                confidence_score      = a.confidence_score,
                professionalism_score = a.professionalism_score,
                overall_score         = round(overall, 1),
                word_count            = len(a.transcribed_text.split()),
                filler_word_count     = a.filler_word_count,
                words_per_minute      = a.words_per_minute,
                answer_duration       = a.answer_duration,
                source                = "gpt_evaluated",
            )
            db.add(point)
            rows_saved += 1

        db.commit()
    return rows_saved


def export_to_csv() -> str:
    """
    Export all training data from DB to CSV file.
    Returns path to the CSV file.
    """
    EXPORT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with Session(engine) as db:
        rows = db.scalars(select(TrainingDataPoint)).all()

    fieldnames = [
        "id", "question_text", "answer_text", "interview_type", "domain", "difficulty",
        "communication_score", "technical_score", "confidence_score", "professionalism_score",
        "overall_score", "word_count", "filler_word_count", "words_per_minute",
        "answer_duration", "source",
    ]

    with open(EXPORT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({k: getattr(row, k, "") for k in fieldnames})

    print(f"[DataCollector] Exported {len(rows)} rows to {EXPORT_PATH}")
    return str(EXPORT_PATH)


def get_stats() -> dict:
    """Return training data statistics."""
    with Session(engine) as db:
        rows = db.scalars(select(TrainingDataPoint)).all()

    if not rows:
        return {"total_rows": 0}

    return {
        "total_rows":  len(rows),
        "avg_overall": round(sum(r.overall_score for r in rows) / len(rows), 1),
        "by_type": {t: sum(1 for r in rows if r.interview_type == t)
                    for t in ["Technical", "HR", "Behavioral", "Aptitude"]},
        "by_difficulty": {d: sum(1 for r in rows if r.difficulty == d)
                         for d in ["Easy", "Medium", "Hard"]},
    }
