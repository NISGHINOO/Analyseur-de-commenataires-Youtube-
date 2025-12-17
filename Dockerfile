FROM python:3.10-slim
ENV PORT=7860
EXPOSE 7860
WORKDIR /app

# Copier fichiers nécessaires
COPY app_api.py /app/
COPY models/ /app/models/
COPY src/ /app/src/
COPY requirements-prod.txt /app/

# Installer dépendances
RUN pip install --no-cache-dir -r requirements-prod.txt

# Lancer l’API
CMD ["uvicorn", "app_api:app", "--host", "0.0.0.0", "--port", "7860"]
