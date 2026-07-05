from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.database import Base

class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(Integer, primary_key=True, index=True)
    whatsapp_number = Column(String, index=True)
    report_content = Column(String)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    status = Column(String, default="Baru", index=True)  # Pilihan: Baru, Sedang Ditangani, Selesai
    is_grouped = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

    zone = relationship("Zone")