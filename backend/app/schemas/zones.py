from typing import Optional
from pydantic import BaseModel

class ZoneCreate(BaseModel):
    name: str
    wilayah: Optional[str] = None
    kecamatan: Optional[str] = None
    kelurahan: Optional[str] = None
    jenis_tps: Optional[str] = None
    alamat: Optional[str] = None
    latitude: float
    longitude: float
    risk_status: Optional[str] = "Normal"

class ZoneUpdate(BaseModel):
    name: Optional[str] = None
    wilayah: Optional[str] = None
    kecamatan: Optional[str] = None
    kelurahan: Optional[str] = None
    jenis_tps: Optional[str] = None
    alamat: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    risk_status: Optional[str] = None

class AIInsight(BaseModel):
    largest_driver: str
    rainfall_mm: float
    is_weekend: bool
    is_holiday: bool
    active_event: Optional[str] = None
    risk_factors: dict
    confidence_level: str

class ZoneResponse(BaseModel):
    id: int
    name: str
    wilayah: Optional[str] = None
    kecamatan: Optional[str] = None
    kelurahan: Optional[str] = None
    jenis_tps: Optional[str] = None
    alamat: Optional[str] = None
    latitude: float
    longitude: float
    risk_status: str
    ai_insights: Optional[AIInsight] = None

    class Config:
        from_attributes = True