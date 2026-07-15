from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base
from app.utils.timezone import get_jakarta_now

class RouteRecommendation(Base):
    __tablename__ = "route_recommendations"

    id                  = Column(Integer, primary_key=True)
    forecast_batch_id   = Column(String(30), index=True, nullable=True)
    coverage_area       = Column(String, nullable=True, index=True)   # e.g. "Jakarta Timur"
    driver_id           = Column(Integer, ForeignKey("users.id"), nullable=True)
    total_stops         = Column(Integer, nullable=True)              # # of TPS stops (excl. depot)
    route_json          = Column(Text)                                # JSON list of stop dicts
    status              = Column(String, default="Pending", nullable=False)
    created_at          = Column(DateTime, default=get_jakarta_now)
    updated_at          = Column(DateTime, default=get_jakarta_now, onupdate=get_jakarta_now)

    driver = relationship("User")