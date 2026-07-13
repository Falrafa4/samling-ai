from sqlalchemy import Column, ForeignKey, Integer, Float, DateTime, String
from sqlalchemy.sql import func
from app.database.database import Base

class VolumePrediction(Base):
    __tablename__ = "volume_predictions"

    id = Column(Integer, primary_key=True)
    forecast_batch_id = Column(String(30), index=True)
    kecamatan = Column(String, ForeignKey("zones.kecamatan"), nullable=False)
    tps_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    predicted_volume_percentage = Column(Float)
    priority_rank = Column(Integer)
    prediction_status = Column(String)
    model_version = Column(String)
    created_at = Column(DateTime, default=func.now())
