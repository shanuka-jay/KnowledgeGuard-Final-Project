"""
KnowledgeGuard ML Microservice
FastAPI + scikit-learn

Endpoints:
  POST /train              — train Random Forest (synthetic or real data)
  POST /predict            — predict risk score for one employee
  GET  /metrics            — model performance metrics
  POST /anomaly            — detect anomalous score change (Isolation Forest)
  GET  /feature-importance — which indicator matters most
  GET  /health             — health check
"""

from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel, Field
from typing import List, Optional
import numpy as np
import joblib
import os
import json
from datetime import datetime

from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report
)
from sklearn.preprocessing import label_binarize
from collections import Counter

app = FastAPI(title="KnowledgeGuard ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Constants ────────────────────────────────────────────────
API_KEY_NAME = "x-api-key"
API_KEY = os.environ.get("ML_API_KEY", "default-dev-ml-key")
api_key_scheme = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def get_api_key(api_key: str = Security(api_key_scheme)):
    if api_key == API_KEY:
        return api_key
    raise HTTPException(status_code=401, detail="Invalid or missing API Key")

MODEL_PATH   = "model.joblib"
METRICS_PATH = "metrics.json"
FEATURES     = ["expertiseUniqueness", "documentationGap", "projectCriticality",
                 "collaborationDependency", "tenure"]
TIERS        = ["low", "medium", "high", "critical"]

# Tier score midpoints for converting classification back to score
TIER_MIDPOINTS = {"low": 1.5, "medium": 4.3, "high": 6.5, "critical": 8.8}


# ── Pydantic schemas ─────────────────────────────────────────
class TrainingRecord(BaseModel):
    features: List[float]  # [EU, DG, PC, CD, Tenure]
    label: str             # low | medium | high | critical


class TrainRequest(BaseModel):
    use_synthetic: bool = True
    augment_real_data: bool = False
    data: List[TrainingRecord] = []


class PredictRequest(BaseModel):
    expertiseUniqueness:     float = Field(..., ge=1, le=10)
    documentationGap:        float = Field(..., ge=1, le=10)
    projectCriticality:      float = Field(..., ge=1, le=10)
    collaborationDependency: float = Field(..., ge=1, le=10)
    tenure:                  float = Field(..., ge=2, le=10)


class ScorePoint(BaseModel):
    period: str
    score: float


class AnomalyRequest(BaseModel):
    userId: str
    scoreHistory: List[ScorePoint]


# ── Synthetic data generator ─────────────────────────────────
def generate_synthetic_data(n: int = 500):
    """
    Generate synthetic employee profiles.
    Distributions are based on KM literature averages.
    """
    np.random.seed(42)
    X, y = [], []

    for _ in range(n):
        eu = np.random.uniform(1, 10)
        dg = np.random.uniform(1, 10)
        pc = np.random.uniform(1, 10)
        cd = np.random.uniform(1, 10)
        t  = np.random.choice([2, 5, 7, 10], p=[0.25, 0.35, 0.25, 0.15])

        # Formula score to determine ground-truth tier
        score = eu*0.25 + dg*0.20 + pc*0.20 + cd*0.20 + t*0.15

        if score <= 5.0:
            tier = "low"
        elif score <= 7.5:
            tier = "medium"
        elif score <= 9.0:
            tier = "high"
        else:
            tier = "critical"

        X.append([eu, dg, pc, cd, t])
        y.append(tier)

    return np.array(X), np.array(y)


# ── Load model (if exists) ───────────────────────────────────
clf = None
if os.path.exists(MODEL_PATH):
    try:
        clf = joblib.load(MODEL_PATH)
        print("Existing model loaded from", MODEL_PATH)
    except Exception as e:
        print("Could not load model:", e)


# ════════════════════════════════════════════════════════════
# ENDPOINTS
# ════════════════════════════════════════════════════════════

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": clf is not None,
        "model_file": os.path.exists(MODEL_PATH),
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/train")
def train(body: TrainRequest, api_key: str = Depends(get_api_key)):
    global clf

    try:
        if body.use_synthetic:
            X, y = generate_synthetic_data(500)
            data_source = "synthetic"
            sample_size = 500
        else:
            if len(body.data) < 10 and not body.augment_real_data:
                raise HTTPException(400, "Need at least 10 real records to train")
            if len(body.data) < 2 and body.augment_real_data:
                raise HTTPException(400, "Need at least 2 real records to augment")
            
            real_X = np.array([r.features for r in body.data])
            real_y = np.array([r.label for r in body.data])
            
            if body.augment_real_data:
                target_size = 500
                augmented_X, augmented_y = [], []
                np.random.seed(42)
                for i in range(target_size):
                    idx = np.random.randint(0, len(real_X))
                    base_features = real_X[idx]
                    label = real_y[idx]
                    jitter = np.random.normal(0, 0.5, size=len(base_features))
                    new_features = np.clip(base_features + jitter, 1.0, 10.0)
                    augmented_X.append(new_features)
                    augmented_y.append(label)
                X = np.array(augmented_X)
                y = np.array(augmented_y)
                data_source = "real_augmented"
                sample_size = target_size
            else:
                X = real_X
                y = real_y
                data_source = "real"
                sample_size = len(body.data)

        if X.size == 0 or len(y) == 0:
            raise HTTPException(400, "No training records were provided")

        class_counts = Counter(y.tolist())
        if len(class_counts) < 2:
            raise HTTPException(
                400,
                "Training needs at least two different risk tiers. Add validated records from more than one tier or use synthetic training.",
            )

        # Train Random Forest
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            min_samples_split=5,
            random_state=42,
            class_weight="balanced",
        )

        min_class_count = min(class_counts.values())
        if min_class_count >= 2:
            n_splits = min(5, min_class_count)
            cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
            cv_scores = cross_val_score(model, X, y, cv=cv, scoring="f1_weighted")
            cv_f1_mean = round(float(cv_scores.mean()), 4)
            cv_f1_std = round(float(cv_scores.std()), 4)
            cv_note = f"{n_splits}-fold stratified cross-validation"
        else:
            cv_f1_mean = 0.0
            cv_f1_std = 0.0
            cv_note = "Skipped because at least one risk tier has only one record"

        # Final fit on all data
        model.fit(X, y)
        clf = model
        joblib.dump(clf, MODEL_PATH)

        # Compute metrics on training data
        y_pred = model.predict(X)
        y_prob = model.predict_proba(X)
        classes = model.classes_.tolist()

        acc = accuracy_score(y, y_pred)
        f1 = f1_score(y, y_pred, average="weighted", zero_division=0)
        prec = precision_score(y, y_pred, average="weighted", zero_division=0)
        rec = recall_score(y, y_pred, average="weighted", zero_division=0)

        # AUC (one-vs-rest for multiclass)
        try:
            if len(classes) == 2:
                auc = roc_auc_score(y, y_prob[:, 1])
            else:
                y_bin = label_binarize(y, classes=classes)
                auc = roc_auc_score(y_bin, y_prob, multi_class="ovr", average="weighted")
        except Exception:
            auc = 0.0

        # Feature importance
        fi = dict(zip(FEATURES, model.feature_importances_.round(4).tolist()))

        metrics = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1": round(f1, 4),
            "auc_roc": round(auc, 4),
            "cv_f1_mean": cv_f1_mean,
            "cv_f1_std": cv_f1_std,
            "cv_note": cv_note,
            "feature_importance": fi,
            "sample_size": sample_size,
            "data_source": data_source,
            "trained_at": datetime.now().isoformat(),
            "classes": classes,
            "class_counts": dict(class_counts),
        }

        # Save metrics for later retrieval
        with open(METRICS_PATH, "w") as f:
            json.dump(metrics, f, indent=2)

        print(f"Model trained: acc={acc:.3f} f1={f1:.3f} data={data_source} n={sample_size}")
        return {"success": True, **metrics}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, f"ML training failed: {exc}")

@app.post("/predict")
def predict(body: PredictRequest, api_key: str = Depends(get_api_key)):
    global clf

    # Auto-train on synthetic if no model exists
    if clf is None:
        print("No model found — auto-training on synthetic data")
        train(TrainRequest(use_synthetic=True))

    if clf is None:
        raise HTTPException(status_code=500, detail="Model could not be initialized")

    features = np.array([[
        body.expertiseUniqueness,
        body.documentationGap,
        body.projectCriticality,
        body.collaborationDependency,
        body.tenure,
    ]])

    tier_pred  = str(clf.predict(features)[0])
    tier_proba = clf.predict_proba(features)[0]
    classes    = clf.classes_.tolist()

    # Convert tier to a continuous score using weighted probabilities
    predicted_score = sum(
        TIER_MIDPOINTS.get(c, 5.0) * float(p)
        for c, p in zip(classes, tier_proba)
    )
    predicted_score = round(float(predicted_score), 2)
    predicted_score = max(0.0, min(10.0, predicted_score))

    # Confidence based on max probability
    max_prob = float(max(tier_proba))
    confidence = "high" if max_prob >= 0.7 else "medium" if max_prob >= 0.5 else "low"

    return {
        "predicted_score": predicted_score,
        "predicted_tier":  tier_pred,
        "confidence":      confidence,
        "probabilities":   dict(zip(classes, [round(float(p), 4) for p in tier_proba])),
    }


@app.get("/metrics")
def get_metrics(api_key: str = Depends(get_api_key)):
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH) as f:
            return json.load(f)
    return {
        "error": "Model not trained yet",
        "message": "POST /train to train the model first",
    }


@app.post("/anomaly")
def detect_anomaly(body: AnomalyRequest, api_key: str = Depends(get_api_key)):
    if len(body.scoreHistory) < 3:
        return {"is_anomaly": False, "message": "Need at least 3 data points for anomaly detection"}

    scores = np.array([p.score for p in body.scoreHistory]).reshape(-1, 1)

    iso = IsolationForest(contamination=0.15, random_state=42)
    iso.fit(scores)

    latest_score = scores[-1].reshape(1, -1)
    prediction   = int(iso.predict(latest_score)[0])
    anomaly_score= float(iso.score_samples(latest_score)[0])

    is_anomaly = bool(prediction == -1)

    return {
        "is_anomaly":    is_anomaly,
        "anomaly_score": round(anomaly_score, 4),
        "latest_score":  float(scores[-1][0]),
        "mean_score":    round(float(scores.mean()), 2),
        "message": (
            "Unusual score change detected. May indicate a significant knowledge risk shift."
            if is_anomaly else
            "Score pattern is within normal range."
        ),
    }


@app.get("/feature-importance")
def feature_importance(api_key: str = Depends(get_api_key)):
    global clf
    if clf is None:
        raise HTTPException(404, "Model not trained yet. POST /train first.")

    fi = clf.feature_importances_
    ranked = sorted(
        zip(FEATURES, fi.round(4).tolist()),
        key=lambda x: x[1],
        reverse=True,
    )

    return {
        "ranked": [{"feature": f, "importance": i} for f, i in ranked],
        "raw": dict(zip(FEATURES, fi.round(4).tolist())),
    }
