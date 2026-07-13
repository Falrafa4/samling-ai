from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2)
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    role: Optional[str] = "admin"  # 'admin' atau 'driver'
    whatsapp_number: Optional[str] = None
    status: Optional[str] = None  # 'Available', 'On Duty', 'Offline'
    coverage_area: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    username: str
    role: str
    whatsapp_number: Optional[str] = None
    status: Optional[str] = None
    coverage_area: Optional[str] = None
    depot_latitude: Optional[float] = None
    depot_longitude: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True  # Pydantic v2 compatible
