from typing import Optional
from pydantic import BaseModel, Field
from datetime import date, datetime

class EventCreate(BaseModel):
    name: str = Field(..., max_length=150)
    start_date: date
    end_date: date
    location: Optional[str] = Field(None, max_length=150)
    wilayah: str = Field(..., max_length=50)
    kecamatan: str = Field(..., max_length=50)
    urgency_score: float = Field(0.5, ge=0.0, le=1.0)
    description: Optional[str] = None

class EventUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=150)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    location: Optional[str] = Field(None, max_length=150)
    wilayah: Optional[str] = Field(None, max_length=50)
    kecamatan: Optional[str] = Field(None, max_length=50)
    urgency_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    description: Optional[str] = None

class EventResponse(BaseModel):
    id: int
    name: str
    start_date: date
    end_date: date
    location: Optional[str] = None
    wilayah: str
    kecamatan: str
    urgency_score: float
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
