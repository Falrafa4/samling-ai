from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.schemas.zones import ZoneResponse

class CitizenReportCreate(BaseModel):
    whatsapp_number: str = Field(..., pattern=r"^62\d{9,13}$")  # Format WhatsApp Indonesia (misal: 6281234567890)
    report_content: str
    zone_id: int

class CitizenReportUpdate(BaseModel):
    zone_id: Optional[int] = None
    status: Optional[str] = Field(None, description="Pilihan: Baru, Sedang Ditangani, Selesai")

class CitizenReportResponse(BaseModel):
    id: int
    whatsapp_number: str
    report_content: str
    zone_id: int
    status: str
    is_grouped: bool
    created_at: datetime
    zone: Optional[ZoneResponse] = None

    class Config:
        from_attributes = True
