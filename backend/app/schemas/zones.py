from typing import Optional
from pydantic import BaseModel

class ZoneCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    risk_status: Optional[str] = "Normal"

class ZoneUpdate(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    risk_status: Optional[str] = None

class ZoneResponse(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    risk_status: str

    class Config:
        from_attributes = True