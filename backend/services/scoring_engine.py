"""
services/scoring_engine.py — Aggregate per-answer scores into a final session report

Formula from SmartHire AI spec:
  Overall = (Communication × 30%) + (Confidence × 25%) + (Technical × 30%) + (Professionalism × 15%)

Rating rubric:
  90-100 → Excellent
  75-89  → Good
  60-74  → Average
  40-59  → Needs Improvement
  <40    → Poor
"""
from __future__ import annotations
import os, json
def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key or api_key.startswith("sk-your"):
        return None
    try:
        return OpenAI(api_key=api_key)
    except Exception:
        return None



# ── Scoring weights (must sum to 1.0) ────────────────────────────────────────
WEIGHTS = {
    "communication":   0.30,
    "confidence":      0.25,
    "technical":       0.30,
    "professionalism": 0.15,
}


def calculate_overall_score(
    communication: float,
    confidence: float,
    technical: float,
    professionalism: float,
) -> float:
    """Apply the weighted formula and return overall score (0-100)."""
    score = (
        communication   * WEIGHTS["communication"] +
        confidence      * WEIGHTS["confidence"] +
        technical       * WEIGHTS["technical"] +
        professionalism * WEIGHTS["professionalism"]
    )
    return round(score, 1)


def get_rating(overall_score: float) -> str:
    """Convert numeric score to rating label."""
    if overall_score >= 90:
        return "Excellent"
    elif overall_score >= 75:
        return "Good"
    elif overall_score >= 60:
        return "Average"
    elif overall_score >= 40:
        return "Needs Improvement"
    return "Poor"


def aggregate_answers(answers: list[dict]) -> dict:
    """
    Average all per-answer scores across the session.
    answers: list of InterviewAnswer.to_dict()
    """
    if not answers:
        return {
            "communication": 0, "confidence": 0,
            "technical": 0, "professionalism": 0,
            "avg_filler_words": 0, "avg_wpm": 0, "avg_eye_contact": 0,
        }

    n = len(answers)
    return {
        "communication":    round(sum(a["communication_score"]   for a in answers) / n, 1),
        "confidence":       round(sum(a["confidence_score"]      for a in answers) / n, 1),
        "technical":        round(sum(a["technical_score"]       for a in answers) / n, 1),
        "professionalism":  round(sum(a["professionalism_score"] for a in answers) / n, 1),
        "avg_filler_words": round(sum(a.get("filler_word_count", 0) for a in answers) / n, 1),
        "avg_wpm":          round(sum(a.get("words_per_minute", 0)  for a in answers) / n, 1),
        "avg_eye_contact":  round(sum(a.get("eye_contact_score", 0) for a in answers) / n, 1),
    }


def generate_text_feedback(
    aggregated: dict,
    interview_type: str,
    domain: str,
    overall_score: float,
) -> dict:
    """
    Ask GPT to generate strengths, weaknesses, and suggestions
    based on aggregated scores.
    """
    prompt = f"""
A candidate just completed a {interview_type} interview in {domain}.

Their scores:
- Communication:    {aggregated['communication']}/100
- Confidence:       {aggregated['confidence']}/100
- Technical:        {aggregated['technical']}/100
- Professionalism:  {aggregated['professionalism']}/100
- Overall:          {overall_score}/100
- Avg filler words per answer: {aggregated['avg_filler_words']}
- Avg speaking pace: {aggregated['avg_wpm']} WPM
- Avg eye contact score: {aggregated['avg_eye_contact']}/100

Generate a coaching report. Return JSON:
{{
  "strengths": "<2-3 sentences about what they did well>",
  "weaknesses": "<2-3 sentences about what needs improvement>",
  "suggestions": "<3 specific actionable steps to improve before next interview>"
}}
"""
    client = get_openai_client()
    if not client:
        return {
            "strengths": "You completed the full interview session — a great start.",
            "weaknesses": f"Technical depth scored {aggregated['technical']}/100 — focus on specifics.",
            "suggestions": "1. Record yourself answering practice questions. 2. Study your weak domain topics. 3. Practice reducing filler words.",
        }

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert interview coach. Respond only with valid JSON."},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.4,
            max_tokens=400,
        )
        return json.loads(response.choices[0].message.content)
    except Exception:
        return {
            "strengths": "You completed the full interview session — a great start.",
            "weaknesses": f"Technical depth scored {aggregated['technical']}/100 — focus on specifics.",
            "suggestions": "1. Record yourself answering practice questions. 2. Study your weak domain topics. 3. Practice reducing filler words.",
        }
