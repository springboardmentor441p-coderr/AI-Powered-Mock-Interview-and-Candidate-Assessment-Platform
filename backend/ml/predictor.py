"""
ml/predictor.py — Load trained models and predict scores for new answers

After training is done, this module is used by the scoring router
to predict scores using the trained ML model instead of (or alongside) GPT.

This is the "serve the model" step.
"""
import numpy as np
import joblib
from pathlib import Path

MODEL_DIR = Path(__file__).parent / "saved_models"

TARGETS = [
    "communication_score",
    "technical_score",
    "confidence_score",
    "professionalism_score",
    "overall_score",
]

# Cache loaded models in memory (loaded once on first call)
_models: dict = {}


def _load_models():
    """Load all saved model files into memory."""
    global _models
    if _models:
        return  # already loaded

    for target in TARGETS:
        model_path = MODEL_DIR / f"{target}_model.pkl"
        if model_path.exists():
            _models[target] = joblib.load(model_path)
            print(f"[Predictor] Loaded model: {target}")
        else:
            print(f"[Predictor] Model not found: {model_path} — run ml/train_model.py first")


def predict_scores(feature_vector: np.ndarray) -> dict:
    """
    Given a feature vector (from feature_extractor.extract_features),
    return predicted scores for all 5 dimensions.

    Returns dict like:
    {
      "communication_score": 72.4,
      "technical_score": 68.1,
      "confidence_score": 75.0,
      "professionalism_score": 70.2,
      "overall_score": 71.5,
      "source": "ml_model"
    }
    """
    _load_models()

    if not _models:
        return {"error": "Models not trained yet. Run ml/train_model.py first.", "source": "none"}

    fv = feature_vector.reshape(1, -1)
    result = {"source": "ml_model"}

    for target in TARGETS:
        if target in _models:
            pred = float(_models[target].predict(fv)[0])
            pred = round(max(0, min(100, pred)), 1)  # clamp 0-100
            result[target] = pred
        else:
            result[target] = 0.0

    return result


def model_status() -> dict:
    """Check which models are trained and ready."""
    status = {}
    for target in TARGETS:
        model_path = MODEL_DIR / f"{target}_model.pkl"
        status[target] = "ready" if model_path.exists() else "not_trained"
    return status
