"""
Scoring engine.
Uses the trained ML model if available, else falls back to rule-based scoring.
Formula: Communication×30% + Confidence×25% + Technical×30% + Professionalism×15%
"""
import os
import re
import joblib
import numpy as np
from pathlib import Path

MODEL_PATH = Path(__file__).parent.parent / "ml" / "scoring_model.pkl"

# Load trained model once at import time (if it exists)
_model = None
def _get_model():
    global _model
    if _model is None and MODEL_PATH.exists():
        _model = joblib.load(MODEL_PATH)
    return _model


def score_response(
    transcript: str,
    speech_features: dict,
    vision_features: dict,
    expected_keywords: list[str],
    question_text: str = "",
) -> dict:
    """
    Scores a single question response.
    Returns sub-scores and the weighted total.
    """
    # ── 1. Communication score (from speech analysis) ──────────────────────
    communication = speech_features.get("communication_score", 0)

    # ── 2. Confidence score (from webcam/vision features) ──────────────────
    eye_contact  = vision_features.get("eye_contact_pct", 70)
    emotion      = vision_features.get("emotion", "neutral")
    attention    = vision_features.get("attention_score", 0.7)
    hesitation   = vision_features.get("hesitation_score", 0.2)

    emotion_bonus = {"confident": 15, "happy": 10, "neutral": 5, "nervous": -5, "sad": -10}.get(emotion, 0)
    confidence = round(
        (eye_contact * 0.4) + (attention * 100 * 0.3) + ((1 - hesitation) * 100 * 0.2) + emotion_bonus * 0.1
    )
    confidence = max(0, min(100, confidence))

    # ── 3. Technical relevance score ───────────────────────────────────────
    technical = _score_technical(transcript, expected_keywords, question_text)

    # ── 4. Professionalism score ───────────────────────────────────────────
    pace          = speech_features.get("pace_wpm", 130)
    filler_count  = speech_features.get("filler_count", 0)
    word_count    = speech_features.get("word_count", 0)

    # Ideal pace: 110-160 wpm
    pace_score    = 100 - abs(pace - 135) if 80 < pace < 200 else 50
    filler_pen    = max(0, 100 - filler_count * 8)
    # Time management: reward answers in range 60-200 words
    time_score    = min(100, int((word_count / 80) * 100)) if word_count < 80 else max(0, 100 - int((word_count - 200) / 5))
    professionalism = round((pace_score * 0.3) + (filler_pen * 0.4) + (time_score * 0.3))
    professionalism = max(0, min(100, professionalism))

    # ── 5. Try ML model if available ──────────────────────────────────────
    model = _get_model()
    if model:
        features = _build_feature_vector(speech_features, vision_features, technical, len(expected_keywords))
        try:
            ml_score = float(model.predict([features])[0])
            # Blend ML with rule-based (60/40)
            technical = round(technical * 0.4 + ml_score * 0.6)
        except Exception:
            pass

    # ── 6. Weighted overall score ──────────────────────────────────────────
    overall = round(
        communication * 0.30 +
        confidence    * 0.25 +
        technical     * 0.30 +
        professionalism * 0.15
    )

    return {
        "communication_score":   round(communication),
        "confidence_score":      round(confidence),
        "technical_score":       round(technical),
        "professionalism_score": round(professionalism),
        "overall_score":         overall,
        "rating":                _rating_label(overall),
    }


def _score_technical(transcript: str, keywords: list[str], question: str) -> float:
    """Keyword-based technical answer evaluation."""
    if not transcript:
        return 0
    t_lower = transcript.lower()
    if not keywords:
        # No keywords — score by length and coherence
        word_count = len(transcript.split())
        return min(100, word_count * 1.2)
    hits = sum(1 for kw in keywords if kw.lower() in t_lower)
    keyword_score = (hits / len(keywords)) * 100
    # Bonus for long detailed answers
    detail_bonus = min(20, len(transcript.split()) / 5)
    return min(100, round(keyword_score + detail_bonus))


def _rating_label(score: float) -> str:
    if score >= 90: return "Excellent"
    if score >= 75: return "Good"
    if score >= 60: return "Average"
    if score >= 40: return "Needs Improvement"
    return "Poor"


def _build_feature_vector(speech: dict, vision: dict, tech_score: float, kw_count: int) -> list:
    return [
        speech.get("word_count", 0),
        speech.get("filler_count", 0),
        speech.get("pace_wpm", 0),
        speech.get("grammar_score", 0),
        speech.get("clarity_score", 0),
        speech.get("completeness_score", 0),
        vision.get("eye_contact_pct", 0),
        vision.get("attention_score", 0),
        vision.get("hesitation_score", 0),
        tech_score,
        kw_count,
    ]


def aggregate_session_scores(response_scores: list[dict]) -> dict:
    """Average all per-question scores into a final session score."""
    if not response_scores:
        return {"communication_score":0,"confidence_score":0,"technical_score":0,"professionalism_score":0,"overall_score":0,"rating":"Poor"}
    keys = ["communication_score","confidence_score","technical_score","professionalism_score"]
    averages = {k: round(np.mean([r[k] for r in response_scores if k in r])) for k in keys}
    overall = round(
        averages["communication_score"]    * 0.30 +
        averages["confidence_score"]       * 0.25 +
        averages["technical_score"]        * 0.30 +
        averages["professionalism_score"]  * 0.15
    )
    return {**averages, "overall_score": overall, "rating": _rating_label(overall)}
