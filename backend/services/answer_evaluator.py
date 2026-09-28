"""
services/answer_evaluator.py — Evaluate a candidate's answer using OpenAI GPT

For each answer GPT returns:
  - communication_score  (0-100) — clarity, grammar, fluency
  - technical_score      (0-100) — accuracy, keyword coverage, depth
  - confidence_score     (0-100) — assertiveness, hesitation, completeness
  - professionalism_score(0-100) — tone, etiquette, organization
  - feedback             (str)   — one paragraph of actionable advice

Also includes local speech analysis (filler words, WPM) that does NOT need OpenAI.
"""
import os, json, re
def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key or api_key.startswith("sk-your"):
        return None
    try:
        from openai import OpenAI
        return OpenAI(api_key=api_key)
    except Exception:
        return None


FILLER_WORDS = {"um", "uh", "like", "you know", "basically", "literally",
                "actually", "so", "right", "okay", "hmm", "er", "well"}

EVAL_SYSTEM = """You are a professional interview coach AI for SmartHire AI.
Evaluate the candidate's answer fairly and constructively.
Respond ONLY with valid JSON — no extra text."""


def count_filler_words(text: str) -> int:
    """Count how many filler words appear in the answer."""
    text_lower = text.lower()
    count = 0
    for word in FILLER_WORDS:
        count += len(re.findall(r'\b' + re.escape(word) + r'\b', text_lower))
    return count


def words_per_minute(text: str, duration_seconds: float) -> float:
    """Calculate speaking pace."""
    if duration_seconds <= 0:
        return 0
    word_count = len(text.split())
    return round((word_count / duration_seconds) * 60, 1)


def evaluate_answer(
    question_text: str,
    answer_text: str,
    expected_keywords: list[str],
    interview_type: str,
    duration_seconds: float = 60,
) -> dict:
    """
    Main evaluation function.
    Returns all scores + feedback.
    """
    # ── Local analysis (no API needed) ──────────────────────────────────────
    filler_count = count_filler_words(answer_text)
    wpm          = words_per_minute(answer_text, duration_seconds)
    word_count   = len(answer_text.split())

    # ── GPT evaluation ───────────────────────────────────────────────────────
    prompt = f"""
Question: {question_text}
Interview type: {interview_type}
Expected keywords/concepts: {', '.join(expected_keywords) if expected_keywords else 'none specified'}

Candidate's answer:
"{answer_text}"

Additional signals:
- Filler words used: {filler_count}
- Speaking pace: {wpm} words per minute (ideal: 120-160 WPM)
- Answer length: {word_count} words

Score each dimension from 0 to 100 and give feedback.
Return JSON:
{{
  "communication_score": <0-100>,
  "technical_score": <0-100>,
  "confidence_score": <0-100>,
  "professionalism_score": <0-100>,
  "feedback": "<one paragraph of specific, actionable advice>"
}}
"""
    client = get_openai_client()
    if not client:
        result = _local_score(answer_text, expected_keywords, filler_count, wpm)
    else:
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": EVAL_SYSTEM},
                    {"role": "user",   "content": prompt},
                ],
                temperature=0.3,
                max_tokens=500,
            )
            raw    = response.choices[0].message.content
            result = json.loads(raw)

        except Exception as e:
            print(f"[Evaluator] OpenAI error: {e} — using local scoring")
            result = _local_score(answer_text, expected_keywords, filler_count, wpm)

    # Always attach the local signals
    result["filler_word_count"] = filler_count
    result["words_per_minute"]  = wpm
    result["word_count"]        = word_count
    return result


def _local_score(
    answer_text: str,
    expected_keywords: list[str],
    filler_count: int,
    wpm: float,
) -> dict:
    """
    Fallback scoring without OpenAI.
    Uses keyword overlap and answer length heuristics.
    """
    word_count = len(answer_text.split())

    # Communication: penalize filler words, reward good length
    comm = max(0, min(100, 70 - filler_count * 3 + min(word_count // 5, 20)))

    # Technical: keyword overlap
    if expected_keywords:
        text_lower = answer_text.lower()
        hits = sum(1 for kw in expected_keywords if kw.lower() in text_lower)
        tech = min(100, int((hits / len(expected_keywords)) * 100))
    else:
        tech = 60  # default if no keywords

    # Confidence: penalize too short or too fast/slow
    if wpm < 80 or wpm > 200:
        conf = 55
    elif word_count < 20:
        conf = 40
    else:
        conf = 70

    # Professionalism: assume decent unless very short
    prof = 65 if word_count > 15 else 40

    return {
        "communication_score":    float(comm),
        "technical_score":        float(tech),
        "confidence_score":       float(conf),
        "professionalism_score":  float(prof),
        "feedback": "Keep practicing — try to reduce filler words and add more specific technical details.",
    }
