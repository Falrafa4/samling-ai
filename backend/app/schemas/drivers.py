from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.schemas.fleets import FleetResponse

class DriverCreate(BaseModel):
    name: str = Field(..., min_length=2)
    whatsapp_number: str = Field(..., pattern=r"^62\d{9,13}$")  # Format standar WhatsApp Indonesia
    fleet_id: Optional[int] = None
    username: str = Field(..., min_length=3)
    password: Optional[str] = None  # Bisa diisi manual, atau default ke 'driver123' jika kosong
    coverage_area: Optional[str] = None

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    whatsapp_number: Optional[str] = Field(None, pattern=r"^62\d{9,13}$")
    fleet_id: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    status: Optional[str] = None  # 'Available', 'On Duty', 'Offline'
    coverage_area: Optional[str] = None

class DriverResponse(BaseModel):
    id: int
    name: str
    username: str
    whatsapp_number: str
    fleet_id: Optional[int] = None
    fleet: Optional[FleetResponse] = None
    status: Optional[str] = "Offline"
    role: str = "driver"
    coverage_area: Optional[str] = None
    depot_latitude: Optional[float] = None
    depot_longitude: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True  # Pydantic v2
