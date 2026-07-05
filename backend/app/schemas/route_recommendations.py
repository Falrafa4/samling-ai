from pydantic import BaseModel, Field
from datetime import datetime

class RouteRecommendationCreate(BaseModel):
    driver_id: int
    route_json: str = Field(..., description="Format JSON String berisi daftar ID zona terurut. Contoh: '[1, 3, 5]'")

class RouteRecommendationResponse(BaseModel):
    id: int
    driver_id: int
    route_json: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
