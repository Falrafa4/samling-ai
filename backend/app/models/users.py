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
    fleet_id = Column(Integer, ForeignKey("fleets.id"), nullable=True)
    status = Column(String, nullable=True)  # 'Available', 'On Duty', 'Offline' (untuk driver)
    coverage_area = Column(String, nullable=True)  # 'Jakarta Pusat', 'Jakarta Utara', dll.
    created_at = Column(DateTime, default=func.now())

    fleet = relationship("Fleet", back_populates="drivers")

    @property
    def depot_latitude(self):
        from app.utils.depots import get_depot_coords
        coords = get_depot_coords(self.coverage_area)
        return coords["latitude"] if coords else None

    @property
    def depot_longitude(self):
        from app.utils.depots import get_depot_coords
        coords = get_depot_coords(self.coverage_area)
        return coords["longitude"] if coords else None
