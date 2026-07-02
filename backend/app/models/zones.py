from sqlalchemy import Column, Integer, String, Float, DateTime, Enum
from sqlalchemy.sql import func
from app.databases.database import Base

class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    risk_status = Column(Enum("Normal", "Warning", "High Priority", name="risk_status_enum"), default="Low")
    created_at = Column(DateTime, default=func.now())