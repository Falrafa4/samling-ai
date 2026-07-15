from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from app.database.database import Base
from app.utils.timezone import get_jakarta_now

class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(Integer, primary_key=True, index=True)
    whatsapp_number = Column(String, index=True)
    report_content = Column(String)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    status = Column(String, default="Baru", index=True)  # Pilihan: Baru, Sedang Ditangani, Selesai
    is_grouped = Column(Boolean, default=False)
    image_path = Column(String, nullable=True)
    type = Column(Enum("waste", "event", name="report_type_enum"), default="waste", nullable=False, index=True)
    created_at = Column(DateTime, default=get_jakarta_now)

    zone = relationship("Zone")