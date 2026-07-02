from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.databases.database import Base

class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    sensor_type = Column(String, index=True)
    fill_percentage = Column(Float)
    value = Column(Float)
    created_at = Column(DateTime, default=func.now())