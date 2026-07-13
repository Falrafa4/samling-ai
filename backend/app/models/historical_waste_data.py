from sqlalchemy import Column, Integer, Float, DateTime, String
from app.database.database import Base

class HistoricalWasteData(Base):
    __tablename__ = "historical_waste_data"

    id = Column(Integer, primary_key=True, index=True)
    kecamatan = Column(String)
    tps_id = Column(Integer, index=True)
    tps_type = Column(String)
    zone_population = Column(Integer)
    tps_capacity_kg = Column(Integer)
    day_of_week = Column(Integer)
    is_weekend = Column(Integer)
    is_holiday = Column(Integer)
    daily_growth_rate = Column(Float)
    rainfall_today = Column(Float)
    event_urgency_score = Column(Float)
    current_fill_percentage = Column(Float)
    timestamp_prediction = Column(DateTime)
