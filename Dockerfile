# ==========================
# Dockerfile pour API FastAPI
# ==========================

# Image de base légère
FROM python:3.10-slim

# Définir le répertoire de travail
WORKDIR /app

# Copier uniquement requirements.txt pour optimiser le cache
COPY requirements.txt .

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copier les dossiers nécessaires
COPY src/ ./src/
COPY models/ ./models/

# Exposer le port standard Hugging Face
EXPOSE 7860

# Lancer l'API
CMD ["uvicorn", "src.api.app_api:app", "--host", "0.0.0.0", "--port", "7860"]
