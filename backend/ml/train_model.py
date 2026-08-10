"""
ml/train_model.py — Train the SmartHire AI scoring model

HOW IT WORKS:
  1. Load training data from CSV (collected from interview sessions)
  2. Extract features from each (question, answer) pair
  3. Train 4 separate models — one per score dimension:
       - communication_model
       - technical_model
       - confidence_model
       - professionalism_model
  4. Save all models to saved_models/ with joblib
  5. Print evaluation metrics (MAE, R²)

USAGE:
  python -m backend.ml.train_model

REQUIREMENTS:
  - At least 50+ rows in training_data CSV for meaningful results
  - More data = better predictions
"""
import os, sys
import numpy as np
import pandas as pd
import joblib
from pathlib import Path

from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.ml.feature_extractor import extract_features, FEATURE_NAMES

DATA_PATH   = Path(__file__).parent / "training_data" / "interview_data.csv"
MODEL_DIR   = Path(__file__).parent / "saved_models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

TARGETS = [
    "communication_score",
    "technical_score",
    "confidence_score",
    "professionalism_score",
    "overall_score",
]


def load_data() -> pd.DataFrame:
    """Load training CSV into a DataFrame."""
    if not DATA_PATH.exists():
        print(f"[Train] No training data found at {DATA_PATH}")
        print("[Train] Run some interviews first, then export with data_collector.export_to_csv()")
        sys.exit(1)

    df = pd.read_csv(DATA_PATH)
    print(f"[Train] Loaded {len(df)} training rows")
    return df


def build_features(df: pd.DataFrame) -> np.ndarray:
    """Extract feature matrix from all rows."""
    print("[Train] Extracting features (this may take a few minutes for semantic similarity)...")
    X = []
    for _, row in df.iterrows():
        keywords = []  # keywords stored as CSV in the actual Q row; simplified here
        fv = extract_features(
            question_text     = str(row["question_text"]),
            answer_text       = str(row["answer_text"]),
            expected_keywords = keywords,
            interview_type    = str(row.get("interview_type", "Technical")),
            difficulty        = str(row.get("difficulty", "Medium")),
            words_per_minute  = float(row.get("words_per_minute", 0)),
            filler_count      = int(row.get("filler_word_count", 0)),
        )
        X.append(fv)
    return np.array(X)


def train_single_model(X_train, y_train, X_test, y_test, target_name: str) -> tuple:
    """
    Train the best model for one score dimension.
    Tries Random Forest and Gradient Boosting, picks the better one.
    Returns (fitted_pipeline, mae, r2)
    """
    models = {
        "RandomForest": Pipeline([
            ("scaler", StandardScaler()),
            ("model",  RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)),
        ]),
        "GradientBoosting": Pipeline([
            ("scaler", StandardScaler()),
            ("model",  GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, random_state=42)),
        ]),
    }

    best_pipeline = None
    best_mae      = float("inf")

    for name, pipeline in models.items():
        cv_scores = cross_val_score(pipeline, X_train, y_train, cv=3, scoring="neg_mean_absolute_error")
        avg_mae   = -cv_scores.mean()
        print(f"  {name:25s} CV MAE = {avg_mae:.2f}")
        if avg_mae < best_mae:
            best_mae      = avg_mae
            best_pipeline = pipeline

    # Final fit on full train set
    best_pipeline.fit(X_train, y_train)
    y_pred = best_pipeline.predict(X_test)
    mae    = mean_absolute_error(y_test, y_pred)
    r2     = r2_score(y_test, y_pred)

    return best_pipeline, mae, r2


def train():
    """Main training function."""
    df = load_data()

    if len(df) < 20:
        print(f"[Train] Only {len(df)} rows — need at least 20 for training.")
        print("[Train] Generating synthetic data to demonstrate the pipeline...")
        df = _generate_synthetic_data(200)

    X = build_features(df)
    print(f"[Train] Feature matrix: {X.shape} — {len(FEATURE_NAMES)} features per row")

    results = {}
    for target in TARGETS:
        if target not in df.columns:
            continue

        y = df[target].values.astype(float)
        # Clamp to 0-100 range
        y = np.clip(y, 0, 100)

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        print(f"\n── Training model for: {target} ──")
        pipeline, mae, r2 = train_single_model(X_train, y_train, X_test, y_test, target)

        # Save model
        model_path = MODEL_DIR / f"{target}_model.pkl"
        joblib.dump(pipeline, model_path)

        results[target] = {"mae": round(mae, 2), "r2": round(r2, 3)}
        print(f"  ✓ Test MAE={mae:.2f}, R²={r2:.3f}  → saved to {model_path}")

    # Save feature names alongside model for documentation
    joblib.dump(FEATURE_NAMES, MODEL_DIR / "feature_names.pkl")

    print("\n══ Training complete ══")
    print(f"{'Target':<30} {'MAE':>8} {'R²':>8}")
    print("─" * 50)
    for t, m in results.items():
        print(f"{t:<30} {m['mae']:>8} {m['r2']:>8}")

    return results


def _generate_synthetic_data(n: int) -> pd.DataFrame:
    """
    Generate synthetic training data for demonstration.
    In production, replace with real session data.
    """
    import random
    random.seed(42)
    np.random.seed(42)

    question_bank = [
        "Explain how REST APIs work.",
        "What is a Python decorator?",
        "Tell me about yourself.",
        "Describe a time you solved a difficult problem.",
        "What is the difference between SQL and NoSQL?",
    ]
    answer_bank = [
        "REST APIs use HTTP methods like GET POST PUT DELETE to communicate between client and server.",
        "A decorator is a function that wraps another function to extend its behavior without modifying it.",
        "I am a final year AI and Data Science student with experience in Python FastAPI and React.",
        "I once debugged a critical production database issue under time pressure by analyzing logs systematically.",
        "SQL uses structured tables with schemas while NoSQL is more flexible with documents or key-value pairs.",
    ]

    rows = []
    for _ in range(n):
        comm = max(0, min(100, np.random.normal(70, 15)))
        tech = max(0, min(100, np.random.normal(65, 20)))
        conf = max(0, min(100, np.random.normal(68, 18)))
        prof = max(0, min(100, np.random.normal(72, 12)))
        overall = comm*0.30 + tech*0.30 + conf*0.25 + prof*0.15

        rows.append({
            "question_text":       random.choice(question_bank),
            "answer_text":         random.choice(answer_bank),
            "interview_type":      random.choice(["Technical", "HR", "Behavioral", "Aptitude"]),
            "domain":              random.choice(["Web development", "AI / ML", "Core CS"]),
            "difficulty":          random.choice(["Easy", "Medium", "Hard"]),
            "communication_score": round(comm, 1),
            "technical_score":     round(tech, 1),
            "confidence_score":    round(conf, 1),
            "professionalism_score": round(prof, 1),
            "overall_score":       round(overall, 1),
            "word_count":          random.randint(20, 120),
            "filler_word_count":   random.randint(0, 10),
            "words_per_minute":    random.uniform(80, 180),
            "answer_duration":     random.uniform(20, 120),
        })

    return pd.DataFrame(rows)


if __name__ == "__main__":
    train()
