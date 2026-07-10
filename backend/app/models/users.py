from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="admin", nullable=False)  # 'admin' atau 'driver'
    whatsapp_number = Column(String, nullable=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=True)
    fleet_id = Column(Integer, ForeignKey("fleets.id"), nullable=True)
    status = Column(String, nullable=True)  # 'Available', 'On Duty', 'Offline' (untuk driver)
    created_at = Column(DateTime, default=func.now())

    zone = relationship("Zone")
    fleet = relationship("Fleet", back_populates="drivers")
