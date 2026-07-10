from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Fleet(Base):
    __tablename__ = "fleets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, index=True, nullable=False)  # 'Hulu', 'Tengah', 'Hilir'
    type = Column(String, index=True, nullable=False)      # 'Dump Truck', 'Arm Roll', 'Compactor', etc.
    capacity = Column(String, nullable=True)               # Kapasitas/Volume angkut
    total_units = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=func.now())

    drivers = relationship("User", back_populates="fleet")
