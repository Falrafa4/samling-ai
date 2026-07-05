from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DriverCreate(BaseModel):
    name: str = Field(..., min_length=2)
    whatsapp_number: str = Field(..., pattern=r"^62\d{9,13}$")  # Format standar WhatsApp Indonesia
    zone_id: int
    username: Optional[str] = None  # Bisa diisi manual, atau default ke whatsapp_number jika kosong
    password: Optional[str] = None  # Bisa diisi manual, atau default ke 'driver123' jika kosong

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    whatsapp_number: Optional[str] = Field(None, pattern=r"^62\d{9,13}$")
    zone_id: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    status: Optional[str] = None  # 'Available', 'On Duty', 'Offline'

class DriverResponse(BaseModel):
    id: int
    name: str
    username: str
    whatsapp_number: str
    zone_id: Optional[int] = None
    status: Optional[str] = "Offline"
    role: str = "driver"
    created_at: datetime

    class Config:
        from_attributes = True  # Pydantic v2
