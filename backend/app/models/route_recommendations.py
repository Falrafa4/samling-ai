from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.database import Base

class RouteRecommendation(Base):
    __tablename__ = "route_recommendations"

    id                  = Column(Integer, primary_key=True)
    forecast_batch_id   = Column(String(30), index=True, nullable=True)
    coverage_area       = Column(String, nullable=True, index=True)   # e.g. "Jakarta Timur"
    driver_id           = Column(Integer, ForeignKey("users.id"), nullable=True)
    total_stops         = Column(Integer, nullable=True)              # # of TPS stops (excl. depot)
    route_json          = Column(Text)                                # JSON list of stop dicts
    status              = Column(String, default="Pending", nullable=False)
    created_at          = Column(DateTime, default=func.now())
    updated_at          = Column(DateTime, default=func.now(), onupdate=func.now())

    driver = relationship("User")