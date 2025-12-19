Analyseur de commentaires YouTube - Détection de cyberharcèlement
1️⃣ Description du projet

Ce projet vise à détecter le cyberharcèlement dans les commentaires YouTube.
Il combine :

Un modèle de classification entraîné sur des commentaires annotés.

Une API FastAPI pour exposer les prédictions.

Une extension Chrome pour analyser directement les commentaires d’une vidéo.

Un déploiement Docker et Hugging Face Spaces pour un accès cloud.

Objectifs :

Fournir une analyse en temps réel des commentaires.

Afficher des statistiques et la confiance des prédictions.

Faciliter l’installation via une extension Chrome.

2️⃣ Architecture technique
+-----------------+        +-----------------+       +------------------+
| Chrome Extension| --->   | FastAPI API     | --->  | Modèle ML        |
| (popup + JS)   |        | (Docker/HF)     |       | (RandomForest +  |
|                 |        |                 |       | Vectorizer)      |
+-----------------+        +-----------------+       +------------------+


Technologies utilisées :

Python 3.10

FastAPI + Uvicorn

Scikit-learn, joblib

Docker pour le conteneur

Hugging Face Spaces pour le déploiement

JavaScript / HTML / CSS pour l’extension Chrome

3️⃣ Installation et utilisation
3.1 Cloner le projet
git clone https://github.com/<USERNAME>/projet-complet.git
cd projet-complet

3.2 Installer les dépendances

Dans un environnement virtuel Python :

python -m venv .venv
source .venv/bin/activate    # Linux/Mac
.venv\Scripts\activate       # Windows
pip install -r requirements-prod.txt

3.3 Lancer l’API
uvicorn src.api.app_api:app --host 0.0.0.0 --port 7860


Vérifier le health :

curl http://127.0.0.1:7860/health

3.4 Utiliser l’extension Chrome

Ouvrir Chrome → chrome://extensions/

Activer le Mode développeur

Charger le dossier chrome-extension/

Ouvrir une vidéo YouTube et cliquer sur l’icône de l’extension

Lancer l’analyse



5️⃣ API Documentation
Endpoint /health
GET /health
Response:
{ "status": "healthy" }

Endpoint /predict
POST /predict
Payload:
{
  "comments": ["Exemple commentaire 1", "Exemple commentaire 2"]
}

Response:
{
  "predictions": [
    { "comment": "Exemple commentaire 1", "is_harassment": false, "confidence": 0.08 },
    { "comment": "Exemple commentaire 2", "is_harassment": true, "confidence": 0.92 }
  ],
  "statistics": {
    "total_comments": 2,
    "harassment_detected": 1,
    "harassment_percentage": 50.0
  }
}
