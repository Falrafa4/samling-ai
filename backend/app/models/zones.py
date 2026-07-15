from sqlalchemy import Column, Integer, String, Float, DateTime, Enum
from app.database.database import Base
from app.utils.timezone import get_jakarta_now

class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    wilayah = Column(String, nullable=True, index=True)
    kecamatan = Column(String, nullable=True, index=True)
    kelurahan = Column(String, nullable=True, index=True)
    jenis_tps = Column(String, nullable=True)
    alamat = Column(String, nullable=True)
    latitude = Column(Float)
    longitude = Column(Float)
    risk_status = Column(Enum("Normal", "Warning", "High Priority", name="risk_status_enum"), default="Normal", index=True)
    created_at = Column(DateTime, default=get_jakarta_now)