from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Literal, Union
from app.schemas.drivers import DriverResponse

class RouteStopDepot(BaseModel):
    type: Literal["Depot"]
    name: str


class RouteStopTPS(BaseModel):
    type: Literal["TPS"]
    tps_id: int 
    kecamatan: str
    priority_rank: int
    prediction: float
    latitude: float
    longitude: float


RouteStop = Union[RouteStopDepot, RouteStopTPS]

class RouteRecommendationCreate(BaseModel):
    forecast_batch_id:  str = Field(..., description="ID batch forecast yang memicu rute ini.")
    coverage_area:      str = Field(..., description="Wilayah cakupan, e.g. 'Jakarta Timur'.")
    driver_id:          Optional[int] = Field(None, description="ID driver (nullable sebelum dispatch).")
    total_stops:        Optional[int] = Field(None, description="Jumlah TPS yang dikunjungi (di luar depot).")
    route_json:         str = Field(
        ...,
        description=(
            "JSON string list of stop dicts. Each entry is either "
            "{type:'Depot', name} or {type:'TPS', tps_id, kecamatan, "
            "priority_rank, prediction, latitude, longitude}."
        )
    )


class RouteRecommendationResponse(BaseModel):
    id:                 int
    forecast_batch_id:  Optional[str] = None
    coverage_area:      Optional[str] = None
    driver_id:          Optional[int] = None
    total_stops:        Optional[int] = None
    route_json:         str
    status:             str
    created_at:         datetime
    updated_at:         datetime
    driver:             Optional[DriverResponse] = None

    class Config:
        from_attributes = True


class RouteStatusUpdate(BaseModel):
    status: str = Field(..., description="Pilihan: Pending, In Progress, Completed")
