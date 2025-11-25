from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import numpy as np

# Schemas
class CommentBatch(BaseModel):
    comments: List[str]

class PredictionItem(BaseModel):
    comment: str
    is_harassment: bool
    confidence: float

class Statistics(BaseModel):
    total_comments: int
    harassment_detected: int
    harassment_percentage: float

class PredictionResponse(BaseModel):
    predictions: List[PredictionItem]
    statistics: Statistics

app = FastAPI(
    title="API de Détection de Cyberharcèlement",
    description="API pour détecter le cyberharcèlement dans les commentaires",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "API de Détection de Cyberharcèlement",
        "version": "1.0.0",
        "endpoints": {
            "predict_batch": "/predict_batch",
            "health": "/health"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": True}

@app.post("/predict_batch", response_model=PredictionResponse)
def predict(batch: CommentBatch):
    try:
        comments = batch.comments
        
        if not comments:
            raise HTTPException(status_code=400, detail="Aucun commentaire fourni")
        
        # Import du modèle (ajustez selon votre structure)
        from ..model_loader import model, vectorizer
        
        # Vectorisation
        X = vectorizer.transform(comments)
        
        # Prédictions
        predictions = model.predict(X)
        probabilities = model.predict_proba(X)
        
        # Formatage des résultats
        results = []
        harassment_count = 0
        
        for i, comment in enumerate(comments):
            is_harassment = bool(predictions[i])
            if is_harassment:
                harassment_count += 1
                
            results.append({
                "comment": comment,
                "is_harassment": is_harassment,
                "confidence": float(probabilities[i][1]) if is_harassment else float(probabilities[i][0])
            })
        
        # Calcul des statistiques
        total = len(comments)
        harassment_percentage = (harassment_count / total * 100) if total > 0 else 0.0
        
        statistics = {
            "total_comments": total,
            "harassment_detected": harassment_count,
            "harassment_percentage": harassment_percentage
        }
        
        return PredictionResponse(
            predictions=results,
            statistics=statistics
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse: {str(e)}")