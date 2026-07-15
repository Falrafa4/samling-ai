from sqlalchemy import Column, ForeignKey, Integer, String, DateTime
from app.database.database import Base
from app.utils.timezone import get_jakarta_now

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    whatsapp_number = Column(String, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    created_at = Column(DateTime, default=get_jakarta_now)