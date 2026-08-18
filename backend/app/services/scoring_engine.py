"""
AI-powered scoring engine implementing the SmartHire AI rubric:

Overall Score = Communication(30%) + Confidence(25%) + Technical Relevance(30%)
                + Professionalism(15%)

Signals used per answer:
- answer_text (NLP heuristics: filler words, grammar proxy, length, keywords)
- time_taken_seconds (pace / time management)
- eye_contact_pct, confidence_signal (reported by the browser client from
  webcam/mic monitoring - see frontend InterviewRoom for capture logic)

This is a fully deterministic, explainable scoring model so the platform runs
without any paid AI API. Swap `score_answer` internals for a call to an LLM /
CV model (e.g. DeepFace, MediaPipe, Whisper) for production-grade accuracy.
"""
import re
from typing import Dict, List

FILLER_WORDS = ["um", "uh", "like", "you know", "sort of", "kind of", "basically", "actually", "i mean"]

TECH_KEYWORDS_BY_CATEGORY = {
    "Technical": ["because", "algorithm", "complexity", "design", "implement", "structure", "performance",
                  "trade-off", "scalable", "optimize", "database", "api", "system", "code", "function"],
    "HR": ["team", "company", "goal", "growth", "opportunity", "value", "culture", "communication"],
    "Behavioral": ["situation", "task", "action", "result", "learned", "team", "challenge", "outcome"],
    "Aptitude": ["calculate", "therefore", "equation", "solve", "ratio", "percent", "answer"],
}


def _word_count(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text))


def _filler_count(text: str) -> int:
    lower = text.lower()
    return sum(lower.count(f) for f in FILLER_WORDS)


def _grammar_proxy_score(text: str) -> float:
    """Heuristic proxy: sentence capitalization, punctuation, avg sentence length."""
    if not text.strip():
        return 0.0
    sentences = re.split(r"[.!?]+", text)
    sentences = [s.strip() for s in sentences if s.strip()]
    if not sentences:
        return 40.0
    cap_ratio = sum(1 for s in sentences if s[:1].isupper()) / len(sentences)
    avg_len = sum(_word_count(s) for s in sentences) / len(sentences)
    length_score = 100 if 6 <= avg_len <= 30 else max(40, 100 - abs(avg_len - 18) * 3)
    return round(min(100, cap_ratio * 40 + length_score * 0.6), 1)


def score_answer(question_category: str, answer_text: str, time_taken_seconds: int,
                  eye_contact_pct: float, confidence_signal: float) -> Dict:
    words = _word_count(answer_text)
    fillers = _filler_count(answer_text)

    # --- Communication (30%) ---
    clarity = _grammar_proxy_score(answer_text)
    filler_penalty = max(0, 100 - fillers * 8)
    pace_score = 100 if 20 <= time_taken_seconds <= 180 else max(40, 100 - abs(time_taken_seconds - 90) * 0.4)
    completeness = min(100, (words / 60) * 100) if words < 60 else 100
    communication = round(clarity * 0.30 + filler_penalty * 0.25 + pace_score * 0.20 + completeness * 0.25, 1)

    # --- Confidence (25%) ---
    hesitation_penalty = max(0, 100 - fillers * 10)
    confidence = round(eye_contact_pct * 0.4 + confidence_signal * 0.4 + hesitation_penalty * 0.2, 1)

    # --- Technical Relevance (30%) ---
    keywords = TECH_KEYWORDS_BY_CATEGORY.get(question_category, TECH_KEYWORDS_BY_CATEGORY["Technical"])
    lower = answer_text.lower()
    matched = sum(1 for k in keywords if k in lower)
    keyword_pct = min(100, (matched / max(3, len(keywords) // 2)) * 100)
    depth_score = min(100, (words / 80) * 100)
    technical = round(keyword_pct * 0.55 + depth_score * 0.45, 1)

    # --- Professionalism (15%) ---
    time_mgmt = 100 if 15 <= time_taken_seconds <= 150 else max(30, 100 - abs(time_taken_seconds - 80) * 0.5)
    organization = clarity  # reuse clarity proxy for structure
    professionalism = round(time_mgmt * 0.5 + organization * 0.5, 1)

    return {
        "communication": communication,
        "confidence": confidence,
        "technical": technical,
        "professionalism": professionalism,
        "filler_word_count": fillers,
        "keyword_match_pct": round(keyword_pct, 1),
    }


def rating_from_score(score: float) -> str:
    if score >= 90:
        return "Excellent"
    if score >= 75:
        return "Good"
    if score >= 60:
        return "Average"
    if score >= 40:
        return "Needs Improvement"
    return "Poor"


def aggregate_interview_score(per_question_scores: List[Dict]) -> Dict:
    if not per_question_scores:
        return {
            "communication_score": 0, "confidence_score": 0, "technical_score": 0,
            "professionalism_score": 0, "overall_score": 0, "rating": "Poor",
        }

    n = len(per_question_scores)
    comm = sum(q["communication"] for q in per_question_scores) / n
    conf = sum(q["confidence"] for q in per_question_scores) / n
    tech = sum(q["technical"] for q in per_question_scores) / n
    prof = sum(q["professionalism"] for q in per_question_scores) / n

    overall = round(comm * 0.30 + conf * 0.25 + tech * 0.30 + prof * 0.15, 1)

    return {
        "communication_score": round(comm, 1),
        "confidence_score": round(conf, 1),
        "technical_score": round(tech, 1),
        "professionalism_score": round(prof, 1),
        "overall_score": overall,
        "rating": rating_from_score(overall),
    }


def generate_answer_feedback(question_category: str, answer_text: str, scores: Dict) -> Dict:
    """
    Immediate, per-answer feedback shown right after the candidate submits —
    concrete mistakes spotted in THIS answer, and what to fix next time.
    Separate from generate_feedback(), which summarizes the whole interview.
    """
    mistakes: List[str] = []
    improvements: List[str] = []

    words = _word_count(answer_text)
    fillers = scores.get("filler_word_count", 0)

    if fillers >= 3:
        mistakes.append(f"Used {fillers} filler words (um, like, you know, etc.) — it undercuts how confident you sound.")
        improvements.append("Pause silently instead of filling gaps with \"um\"/\"like\" — a brief pause reads as confidence, not hesitation.")
    elif fillers > 0:
        mistakes.append(f"Used {fillers} filler word — minor, but worth noticing.")

    if words < 15:
        mistakes.append("Answer was very short and likely lacked detail or a concrete example.")
        improvements.append("Expand with a specific example, number, or outcome — aim for at least 30-40 words.")
    elif words > 220:
        mistakes.append("Answer ran long — key points may have gotten buried.")
        improvements.append("Lead with your main point, then support it with 1-2 details, instead of covering everything.")

    if scores["communication"] < 60:
        mistakes.append("Communication clarity was on the lower side (structure/grammar/pacing).")
        improvements.append("Structure the answer as: main point → brief reasoning → example, in that order.")

    if question_category == "Technical" and scores.get("keyword_match_pct", 0) < 35:
        mistakes.append("Didn't reference enough concrete technical concepts relevant to the question.")
        improvements.append("Name specific tools, algorithms, or trade-offs instead of speaking in generalities.")

    if scores["confidence"] < 60:
        mistakes.append("Confidence signals (steadiness, eye contact) were lower for this answer.")
        improvements.append("Keep looking at the camera and slow your pace slightly — rushing reads as nervousness.")

    if scores["professionalism"] < 55:
        mistakes.append("Time management or structure could be tightened for this answer.")
        improvements.append("Aim to answer in roughly 30-90 seconds with a clear beginning and end.")

    if not mistakes:
        mistakes.append("No major issues — clear, well-paced, and relevant answer.")
    if not improvements:
        improvements.append("Keep this same structure and pace for the rest of the interview.")

    return {"mistakes": mistakes, "improvements": improvements}


def generate_feedback(agg: Dict, per_question_scores: List[Dict]) -> Dict:
    strengths, weaknesses, recommendations = [], [], []

    labels = {
        "communication_score": "communication clarity",
        "confidence_score": "confidence and presence",
        "technical_score": "technical depth",
        "professionalism_score": "professionalism and time management",
    }
    for key, label in labels.items():
        score = agg[key]
        if score >= 80:
            strengths.append(f"Strong {label} ({score}/100).")
        elif score < 60:
            weaknesses.append(f"{label.capitalize()} needs improvement ({score}/100).")

    total_fillers = sum(q.get("filler_word_count", 0) for q in per_question_scores)
    if total_fillers > 3 * len(per_question_scores):
        weaknesses.append("Frequent use of filler words (um, like, you know) reduces clarity.")
        recommendations.append("Practice pausing silently instead of using filler words; record yourself and review.")

    avg_keyword = sum(q.get("keyword_match_pct", 0) for q in per_question_scores) / max(1, len(per_question_scores))
    if avg_keyword < 40:
        recommendations.append("Structure technical answers around specific concepts, trade-offs, and concrete examples.")

    if agg["confidence_score"] < 65:
        recommendations.append("Maintain consistent eye contact with the camera and slow down your pace to project confidence.")

    if not strengths:
        strengths.append("Completed the full interview session with reasonable effort across all questions.")
    if not recommendations:
        recommendations.append("Keep practicing mock interviews regularly to maintain consistency across sessions.")

    return {
        "strengths": strengths,
        "weaknesses": weaknesses or ["No major weaknesses detected in this session."],
        "recommendations": recommendations,
    }
