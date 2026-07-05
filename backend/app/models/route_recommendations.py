from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.database import Base

class RouteRecommendation(Base):
    __tablename__ = "route_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    route_json = Column(Text, nullable=False)
    status = Column(String, default="Pending", nullable=False)  # 'Pending', 'In Progress', 'Completed'
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    driver = relationship("User")