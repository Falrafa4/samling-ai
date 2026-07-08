from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Literal
from app.schemas.zones import ZoneResponse

VALID_SENSOR_TYPES = Literal[
    "Ultrasonic-Organic",
    "Ultrasonic-Anorganic",
    "MQ-135",
    "DHT-22-Temp",
    "DHT-22-Humid"
]

class SensorDataCreate(BaseModel):
    zone_id: int
    sensor_type: VALID_SENSOR_TYPES = Field(..., description="Jenis sensor IoT yang terpasang di lapangan")
    fill_percentage: float = Field(..., ge=0.0, le=100.0)  # Harus di rentang 0.0 - 100.0
    value: float

class SensorDataResponse(BaseModel):
    id: int
    zone_id: int
    sensor_type: str
    fill_percentage: float
    value: float
    created_at: datetime
    updated_at: datetime
    zone: Optional[ZoneResponse] = None

    class Config:
        from_attributes = True

class SensorDataBulkResponse(BaseModel):
    id: int
    zone_id: int
    sensor_type: str
    fill_percentage: float
    value: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
