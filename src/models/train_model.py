import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix
import joblib
import os
import time

# Charger les fichiers train/test
train_df = pd.read_csv("data/processed/train.csv")
test_df = pd.read_csv("data/processed/test.csv")

# Remplacer les valeurs manquantes par des chaînes vides
train_df['clean_comment'] = train_df['clean_comment'].fillna('')
test_df['clean_comment'] = test_df['clean_comment'].fillna('')

X_train = train_df['clean_comment']
y_train = train_df['category']
X_test = test_df['clean_comment']
y_test = test_df['category']

# Vectorisation TF-IDF
tfidf = TfidfVectorizer(max_features=5000, ngram_range=(1,2), stop_words='english')
X_train_tfidf = tfidf.fit_transform(X_train)
X_test_tfidf = tfidf.transform(X_test)

# Logistic Regression avec GridSearchCV
param_grid = {'C': [0.1, 1, 10], 'solver': ['lbfgs', 'saga']}
grid = GridSearchCV(LogisticRegression(max_iter=500, random_state=42), param_grid, scoring='f1_macro', cv=5)
grid.fit(X_train_tfidf, y_train)
logreg = grid.best_estimator_

# Random Forest
rf = RandomForestClassifier(n_estimators=200, random_state=42)
rf.fit(X_train_tfidf, y_train)

# SVM
svm = SVC(kernel='linear', probability=True, random_state=42)
svm.fit(X_train_tfidf, y_train)

# Évaluation des modèles
models = {'LogisticRegression': logreg, 'RandomForest': rf, 'SVM': svm}
best_model_name = None
best_f1 = 0

for name, model in models.items():
    y_pred = model.predict(X_test_tfidf)
    f1 = f1_score(y_test, y_pred, average='macro')
    acc = accuracy_score(y_test, y_pred)
    print(f"{name} -> Accuracy: {acc:.3f}, F1-macro: {f1:.3f}")
    print("Matrice de confusion :\n", confusion_matrix(y_test, y_pred))
    if f1 > best_f1:
        best_f1 = f1
        best_model_name = name
        best_model = model

# Sauvegarde du meilleur modèle et du TF-IDF
os.makedirs("models", exist_ok=True)
joblib.dump(best_model, f"models/best_model_{best_model_name}.pkl")
joblib.dump(tfidf, "models/tfidf_vectorizer.pkl")
print(f"Meilleur modèle sauvegardé : {best_model_name} avec F1-macro {best_f1:.3f}")

# Temps d'inférence pour 50 commentaires
sample_texts = X_test[:50]
start = time.time()
best_model.predict(tfidf.transform(sample_texts))
end = time.time()
print(f"Temps d'inférence pour 50 commentaires : {(end-start)*1000:.2f} ms")
