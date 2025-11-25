from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.api.schemas import CommentBatch, PredictionResponse
from src.api.model_loader import model, vectorizer

app = FastAPI(
    title="API Détection Cyberharcèlement",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/predict", response_model=PredictionResponse)
def predict(batch: CommentBatch):
    comments = batch.comments
    try:
        X = vectorizer.transform(comments)
        predictions = model.predict(X)
        probabilities = model.predict_proba(X)

        results = []
        for i, comment in enumerate(comments):
            results.append({
                "comment": comment,
                "is_harassment": bool(predictions[i]),
                "confidence": float(probabilities[i][1]) if predictions[i] else float(probabilities[i][0])
            })

        return PredictionResponse(predictions=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
