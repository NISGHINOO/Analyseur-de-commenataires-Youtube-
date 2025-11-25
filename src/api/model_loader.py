import joblib
import os

model_path = "models/best_model_LogisticRegression.pkl"  # ou RandomForest/SVM selon ton meilleur modèle
vectorizer_path = "models/tfidf_vectorizer.pkl"

if not os.path.exists(model_path) or not os.path.exists(vectorizer_path):
    raise FileNotFoundError("Modèle ou vectorizer introuvable. Vérifie le chemin.")

model = joblib.load(model_path)
vectorizer = joblib.load(vectorizer_path)
