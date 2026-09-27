import os
import joblib
import numpy as np
from typing import Dict, Any, List
from .train import train_model, MODEL_PATH, VECTORIZER_PATH

_model = None
_vectorizer = None
_feature_names = None
_coefs = None


def get_model():
    """Lazy loader for model and vectorizer with auto-train fallback."""
    global _model, _vectorizer, _feature_names, _coefs
    if _model is None or _vectorizer is None:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
            print("Model artifacts not found. Training model automatically on startup...")
            _vectorizer, _model = train_model()
        else:
            _vectorizer = joblib.load(VECTORIZER_PATH)
            _model = joblib.load(MODEL_PATH)

        _feature_names = _vectorizer.get_feature_names_out()
        _coefs = _model.coef_[0]

    return _vectorizer, _model


def predict_text(text: str) -> Dict[str, Any]:
    """
    Analyzes input text using ML model.
    Returns probability, 0-100 score, confidence, and top contributing n-grams.
    """
    if not text or not text.strip():
        return {
            "ml_probability": 0.0,
            "ml_score": 0,
            "confidence": 0.5,
            "is_phishing": False,
            "top_features": []
        }

    vectorizer, model = get_model()
    global _feature_names, _coefs

    X = vectorizer.transform([text])
    proba = model.predict_proba(X)[0]
    phishing_prob = float(proba[1])
    ml_score = int(round(phishing_prob * 100))

    # Confidence is distance from 0.5 uncertainty normalized to 0.5-1.0 range
    confidence = round(float(abs(phishing_prob - 0.5) * 2 * 0.45 + 0.55), 3)

    # Extract top positive contributing n-grams from this specific text
    feature_indices = X.nonzero()[1]
    contributions = []
    for idx in feature_indices:
        word = _feature_names[idx]
        weight = _coefs[idx] * X[0, idx]
        if weight > 0:  # Positively pushed towards Phishing
            contributions.append({"term": word, "weight": round(float(weight), 3)})

    contributions.sort(key=lambda x: x["weight"], reverse=True)
    top_features = contributions[:5]

    return {
        "ml_probability": round(phishing_prob, 3),
        "ml_score": ml_score,
        "confidence": confidence,
        "is_phishing": phishing_prob >= 0.5,
        "top_features": top_features
    }
