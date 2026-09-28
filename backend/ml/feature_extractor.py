"""
ml/feature_extractor.py — Convert raw text Q&A into numeric features for ML model

The model cannot learn from raw text directly.
We convert each (question, answer) pair into a numeric feature vector.

Features we extract:
  1. answer_word_count       — how long the answer is
  2. filler_word_count       — how many um/uh/like etc.
  3. words_per_minute        — speaking pace
  4. keyword_overlap_ratio   — fraction of expected keywords mentioned
  5. question_word_count     — complexity of the question
  6. answer_question_ratio   — how well answer matches question length
  7. unique_word_ratio        — vocabulary richness
  8. avg_sentence_length     — sentence structure quality
  9. difficulty_encoded      — Easy=0, Medium=1, Hard=2
  10. type_encoded            — Technical=0, HR=1, Behavioral=2, Aptitude=3
  11. semantic_similarity     — cosine similarity between question and answer (uses sentence-transformers)
"""
import re
import numpy as np

FILLER_WORDS = {"um", "uh", "like", "you know", "basically", "literally",
                "actually", "so", "right", "okay", "hmm", "er", "well"}

DIFFICULTY_MAP = {"Easy": 0, "Medium": 1, "Hard": 2}
TYPE_MAP       = {"Technical": 0, "HR": 1, "Behavioral": 2, "Aptitude": 3}

# Sentence transformer model (loaded once)
_embed_model = None

def _get_embed_model():
    global _embed_model
    if _embed_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embed_model = SentenceTransformer("all-MiniLM-L6-v2")
            print("[ML] Sentence transformer loaded.")
        except ImportError:
            print("[ML] sentence-transformers not installed — semantic similarity = 0")
            _embed_model = "unavailable"
    return _embed_model


def semantic_similarity(text_a: str, text_b: str) -> float:
    """Cosine similarity between two texts using sentence embeddings."""
    model = _get_embed_model()
    if model == "unavailable":
        return 0.5  # neutral fallback
    try:
        from numpy.linalg import norm
        embeddings = model.encode([text_a, text_b])
        a, b = embeddings[0], embeddings[1]
        sim = float(np.dot(a, b) / (norm(a) * norm(b) + 1e-10))
        return round(sim, 4)
    except Exception:
        return 0.5


def count_fillers(text: str) -> int:
    text_lower = text.lower()
    return sum(len(re.findall(r'\b' + re.escape(w) + r'\b', text_lower)) for w in FILLER_WORDS)


def unique_word_ratio(text: str) -> float:
    words = text.lower().split()
    if not words:
        return 0
    return round(len(set(words)) / len(words), 4)


def avg_sentence_len(text: str) -> float:
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    if not sentences:
        return 0
    return round(sum(len(s.split()) for s in sentences) / len(sentences), 2)


def keyword_overlap(answer: str, keywords: list[str]) -> float:
    if not keywords:
        return 0.5
    answer_lower = answer.lower()
    hits = sum(1 for kw in keywords if kw.lower() in answer_lower)
    return round(hits / len(keywords), 4)


def extract_features(
    question_text: str,
    answer_text: str,
    expected_keywords: list[str],
    interview_type: str,
    difficulty: str,
    words_per_minute: float = 0,
    filler_count: int | None = None,
) -> np.ndarray:
    """
    Convert one Q&A row into a feature vector.
    Returns numpy array of shape (11,).
    """
    answer_words   = answer_text.split()
    question_words = question_text.split()

    answer_wc  = len(answer_words)
    question_wc = len(question_words)

    fc  = filler_count if filler_count is not None else count_fillers(answer_text)
    wpm = words_per_minute if words_per_minute > 0 else 0

    features = [
        answer_wc,                                              # 0
        fc,                                                     # 1
        wpm,                                                    # 2
        keyword_overlap(answer_text, expected_keywords),        # 3
        question_wc,                                            # 4
        answer_wc / max(question_wc, 1),                       # 5
        unique_word_ratio(answer_text),                        # 6
        avg_sentence_len(answer_text),                         # 7
        DIFFICULTY_MAP.get(difficulty, 1),                     # 8
        TYPE_MAP.get(interview_type, 0),                       # 9
        semantic_similarity(question_text, answer_text),       # 10
    ]
    return np.array(features, dtype=np.float32)


FEATURE_NAMES = [
    "answer_word_count",
    "filler_word_count",
    "words_per_minute",
    "keyword_overlap_ratio",
    "question_word_count",
    "answer_question_ratio",
    "unique_word_ratio",
    "avg_sentence_length",
    "difficulty_encoded",
    "type_encoded",
    "semantic_similarity",
]
