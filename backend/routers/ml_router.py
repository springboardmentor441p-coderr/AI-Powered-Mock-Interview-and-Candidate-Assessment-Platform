"""
routers/ml_router.py — ML model management endpoints

GET  /ml/status          — check if models are trained
POST /ml/train           — trigger training pipeline
POST /ml/predict         — predict scores for a given answer
GET  /ml/export-data     — export training data to CSV
GET  /ml/stats           — training data statistics
"""
from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel
import numpy as np

from backend.routers.auth import get_current_user
from backend.models.user import User
from backend.ml.predictor import predict_scores, model_status
from backend.ml.data_collector import export_to_csv, get_stats
from backend.ml.feature_extractor import extract_features

router = APIRouter()


class PredictRequest(BaseModel):
    question_text: str
    answer_text: str
    expected_keywords: list[str] = []
    interview_type: str = "Technical"
    difficulty: str = "Medium"
    words_per_minute: float = 0
    filler_count: int = 0


@router.get("/status")
def ml_status(current_user: User = Depends(get_current_user)):
    """Check which ML models are trained and ready."""
    return {
        "model_status": model_status(),
        "message": "Run POST /ml/train to train models from collected interview data",
    }


@router.post("/train")
def trigger_training(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    """
    Trigger ML model training in the background.
    This exports training data from DB then trains all scoring models.
    Admin only in production — open for demo.
    """
    def run_training():
        try:
            # Step 1: Export data
            csv_path = export_to_csv()
            print(f"[ML] Data exported to {csv_path}")
            # Step 2: Train
            from backend.ml.train_model import train
            results = train()
            print(f"[ML] Training complete: {results}")
        except Exception as e:
            print(f"[ML] Training error: {e}")

    background_tasks.add_task(run_training)
    return {"message": "Training started in background — check server logs for progress"}


@router.post("/predict")
def predict(
    req: PredictRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Use the trained ML model to predict scores for a given Q&A pair.
    Useful for comparing ML predictions vs GPT evaluations.
    """
    fv = extract_features(
        question_text     = req.question_text,
        answer_text       = req.answer_text,
        expected_keywords = req.expected_keywords,
        interview_type    = req.interview_type,
        difficulty        = req.difficulty,
        words_per_minute  = req.words_per_minute,
        filler_count      = req.filler_count,
    )
    return predict_scores(fv)


@router.get("/export-data")
def export_data(current_user: User = Depends(get_current_user)):
    """Export all training data to CSV and return path."""
    path = export_to_csv()
    stats = get_stats()
    return {"csv_path": path, "stats": stats}


@router.get("/stats")
def training_stats(current_user: User = Depends(get_current_user)):
    """Return statistics about collected training data."""
    return get_stats()
