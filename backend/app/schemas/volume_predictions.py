from pydantic import BaseModel
from datetime import datetime

class VolumePredictionCreate(BaseModel):
    kecamatan: str
    tps_id: int
    tps_type: str
    zone_population: int
    tps_capacity_kg: int
    day_of_week: int
    is_weekend: int
    is_holiday: int
    daily_growth_rate: float
    rainfall_today: float
    event_urgency_score: float
    current_fill_percentage: float
    created_at: datetime

class VolumePredictionResponse(BaseModel):
    id: int
    kecamatan: str
    tps_id: int
    predicted_volume_percentage: float
    prediction_status: str
    created_at: datetime

    # Field kompatibilitas mundur untuk React frontend
    zone_id: int
    predicted_volume: float
    target_time: datetime
    confidence_score: float

    class Config:
        from_attributes = True
