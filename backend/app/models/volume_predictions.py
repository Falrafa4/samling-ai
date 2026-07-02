from sqlalchemy import Column, ForeignKey, Integer, Float, DateTime
from sqlalchemy.sql import func
from app.databases.database import Base

class VolumePrediction(Base):
    __tablename__ = "volume_predictions"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    predicted_volume = Column(Float)
    target_time = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
