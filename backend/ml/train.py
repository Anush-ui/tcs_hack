import os
import pandas as pd
import numpy as np
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "sample_messages.csv")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "model.joblib")
VECTORIZER_PATH = os.path.join(ARTIFACTS_DIR, "vectorizer.joblib")


def train_model():
    """Trains the baseline TF-IDF + LogisticRegression model on banking text."""
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)

    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    texts = df["text"].fillna("").astype(str).tolist()
    labels = df["label"].astype(int).tolist()

    # TF-IDF with unigrams and bigrams for strong phrase capture
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        lowercase=True,
        stop_words="english",
        max_features=5000,
        sublinear_tf=True
    )

    X = vectorizer.fit_transform(texts)
    y = np.array(labels)

    # Train Logistic Regression
    clf = LogisticRegression(C=2.0, max_iter=500, random_state=42)
    clf.fit(X, y)

    # Save artifacts
    joblib.dump(vectorizer, VECTORIZER_PATH)
    joblib.dump(clf, MODEL_PATH)

    print(f"Model and Vectorizer trained successfully on {len(texts)} samples and saved to {ARTIFACTS_DIR}")
    return vectorizer, clf


if __name__ == "__main__":
    train_model()
