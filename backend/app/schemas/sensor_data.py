from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.schemas.zones import ZoneResponse

class SensorDataCreate(BaseModel):
    zone_id: int
    sensor_type: str = Field(..., description="Contoh: Ultrasonic, Infrared")
    fill_percentage: float = Field(..., ge=0.0, le=100.0)  # Harus di rentang 0.0 - 100.0
    value: float

class SensorDataResponse(BaseModel):
    id: int
    zone_id: int
    sensor_type: str
    fill_percentage: float
    value: float
    created_at: datetime
    zone: Optional[ZoneResponse] = None

    class Config:
        from_attributes = True
