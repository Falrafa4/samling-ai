from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base
from app.utils.timezone import get_jakarta_now

class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False, index=True)
    sensor_type = Column(String, index=True)
    fill_percentage = Column(Float)
    value = Column(Float)
    created_at = Column(DateTime, default=get_jakarta_now)
    updated_at = Column(DateTime, default=get_jakarta_now, onupdate=get_jakarta_now)

    zone = relationship("Zone")