# schemas.py
from pydantic import BaseModel
from typing import List

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