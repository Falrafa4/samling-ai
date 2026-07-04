from pydantic import BaseModel, Field
from typing import Optional

class DriverCreate(BaseModel):
    name: str = Field(..., min_length=2)
    whatsapp_number: str = Field(..., pattern=r"^62\d{9,13}$")  # Format standar WhatsApp Indonesia (misal: 6281234567890)
    zone_id: int

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    whatsapp_number: Optional[str] = Field(None, pattern=r"^62\d{9,13}$")
    zone_id: Optional[int] = None

class DriverResponse(BaseModel):
    id: int
    name: str
    whatsapp_number: str
    zone_id: int

    class Config:
        from_attributes = True  # Pydantic v2
