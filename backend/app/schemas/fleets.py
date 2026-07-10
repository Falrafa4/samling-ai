from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FleetCreate(BaseModel):
    name: str = Field(..., min_length=2, description="Nama tipe armada")
    category: str = Field(..., description="Kategori operasional (Hulu, Tengah, Hilir)")
    type: str = Field(..., description="Jenis kendaraan (Dump Truck, Arm Roll, etc.)")
    capacity: Optional[str] = Field(None, description="Kapasitas angkut / volume kendaraan")
    total_units: int = Field(0, ge=0, description="Banyak unit total di dinas")

class FleetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2)
    category: Optional[str] = None
    type: Optional[str] = None
    capacity: Optional[str] = None
    total_units: Optional[int] = Field(None, ge=0)

class FleetResponse(BaseModel):
    id: int
    name: str
    category: str
    type: str
    capacity: Optional[str] = None
    total_units: int
    created_at: datetime

    class Config:
        from_attributes = True
