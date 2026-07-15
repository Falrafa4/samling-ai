from fastapi import FastAPI
from sqladmin import Admin, ModelView

from app.database.database import engine
from app.models.citizen_reports import CitizenReport
from app.models.drivers import Driver
from app.models.fleets import Fleet
from app.models.historical_waste_data import HistoricalWasteData
from app.models.route_recommendations import RouteRecommendation
from app.models.sensor_data import SensorData
from app.models.users import User
from app.models.volume_predictions import VolumePrediction
from app.models.zones import Zone

class ZoneAdmin(ModelView, model=Zone):
    column_list = [Zone.id, Zone.name, Zone.wilayah, Zone.kecamatan, Zone.risk_status]

class SensorDataAdmin(ModelView, model=SensorData):
    column_list = [
        SensorData.id,
        SensorData.zone_id,
        SensorData.sensor_type,
        SensorData.fill_percentage,
        SensorData.value,
        SensorData.created_at,
        SensorData.updated_at,
    ]

class CitizenReportAdmin(ModelView, model=CitizenReport):
    column_list = [
        CitizenReport.id,
        CitizenReport.whatsapp_number,
        CitizenReport.zone_id,
        CitizenReport.status,
        CitizenReport.type,
        CitizenReport.is_grouped,
        CitizenReport.created_at,
    ]

class FleetAdmin(ModelView, model=Fleet):
    column_list = [
        Fleet.id,
        Fleet.name,
        Fleet.category,
        Fleet.type,
        Fleet.capacity,
        Fleet.total_units,
        Fleet.created_at,
    ]

class HistoricalWasteDataAdmin(ModelView, model=HistoricalWasteData):
    column_list = [
        HistoricalWasteData.id,
        HistoricalWasteData.kecamatan,
        HistoricalWasteData.tps_id,
        HistoricalWasteData.tps_type,
        HistoricalWasteData.zone_population,
        HistoricalWasteData.tps_capacity_kg,
        HistoricalWasteData.day_of_week,
        HistoricalWasteData.is_weekend,
        HistoricalWasteData.is_holiday,
        HistoricalWasteData.daily_growth_rate,
        HistoricalWasteData.rainfall_today,
        HistoricalWasteData.event_urgency_score,
        HistoricalWasteData.current_fill_percentage,
        HistoricalWasteData.timestamp_prediction,
    ]

class RouteRecommendationAdmin(ModelView, model=RouteRecommendation):
    column_list = [
        RouteRecommendation.id,
        RouteRecommendation.forecast_batch_id,
        RouteRecommendation.coverage_area,
        RouteRecommendation.driver_id,
        RouteRecommendation.total_stops,
        RouteRecommendation.status,
        RouteRecommendation.created_at,
        RouteRecommendation.updated_at,
    ]

class UserAdmin(ModelView, model=User):
    column_list = [
        User.id,
        User.name,
        User.username,
        User.role,
        User.whatsapp_number,
        User.fleet_id,
        User.status,
        User.coverage_area,
        User.created_at,
    ]

class VolumePredictionAdmin(ModelView, model=VolumePrediction):
    column_list = [
        VolumePrediction.id,
        VolumePrediction.forecast_batch_id,
        VolumePrediction.kecamatan,
        VolumePrediction.tps_id,
        VolumePrediction.predicted_volume_percentage,
        VolumePrediction.priority_rank,
        VolumePrediction.prediction_status,
        VolumePrediction.model_version,
        VolumePrediction.created_at,
    ]

def setup_admin(app: FastAPI) -> Admin:
    admin = Admin(app, engine=engine, title="Database Monitor")
    # admin.add_view(ZoneAdmin)
    # admin.add_view(SensorDataAdmin)
    admin.add_view(CitizenReportAdmin)
    # admin.add_view(FleetAdmin)
    admin.add_view(HistoricalWasteDataAdmin)
    admin.add_view(RouteRecommendationAdmin)
    admin.add_view(UserAdmin)
    admin.add_view(VolumePredictionAdmin)
    return admin
