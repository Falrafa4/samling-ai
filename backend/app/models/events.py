from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from app.database.database import Base
from app.utils.timezone import get_jakarta_now

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    location = Column(String(150), nullable=True)
    wilayah = Column(String(50), nullable=False)
    kecamatan = Column(String(50), nullable=False)
    urgency_score = Column(Float, default=0.5)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=get_jakarta_now)
