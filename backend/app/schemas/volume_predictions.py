from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class VolumePredictionCreate(BaseModel):
    zone_id: int
    predicted_volume: float
    target_time: datetime
    confidence_score: float = Field(..., ge=0.0, le=1.0)  # Desimal 0.0 s.d 1.0

class VolumePredictionResponse(BaseModel):
    id: int
    zone_id: int
    predicted_volume: float
    target_time: datetime
    confidence_score: float
    created_at: datetime

    class Config:
        from_attributes = True
