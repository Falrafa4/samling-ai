from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.models.zones import Zone
from app.models.sensor_data import SensorData
from app.models.citizen_reports import CitizenReport
from app.api.deps import get_current_user
from app.utils.response import response_success

router = APIRouter(tags=["dashboard"], dependencies=[Depends(get_current_user)])

@router.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Mengambil data ringkasan metrik dashboard admin (Macro Metrics).
    Mengembalikan total wilayah berstatus Warning/High Priority, rata-rata isi bak sampah terbaru,
    dan total pengaduan warga.
    """
    # 1. Hitung total wilayah berstatus 'Warning' atau 'High Priority'
    alert_zones_count = (
        db.query(Zone)
        .filter(Zone.risk_status.in_(["Warning", "High Priority"]))
        .count()
    )

    # 2. Hitung rata-rata fill_percentage terbaru per zone_id (hanya sensor Ultrasonic yang mengukur kapasitas bak)
    max_ids_query = (
        db.query(func.max(SensorData.id))
        .filter(SensorData.sensor_type.in_(["Ultrasonic-Organic", "Ultrasonic-Anorganic"]))
        .group_by(SensorData.zone_id, SensorData.sensor_type)
    )
    average_fill_percentage = (
        db.query(func.avg(SensorData.fill_percentage))
        .filter(SensorData.id.in_(max_ids_query))
        .scalar()
    ) or 0.0

    # 3. Hitung total baris laporan di citizen_reports
    total_citizen_reports = db.query(CitizenReport).count()

    summary_data = {
        "alert_zones_count": alert_zones_count,
        "average_fill_percentage": round(float(average_fill_percentage), 2),
        "total_citizen_reports": total_citizen_reports
    }

    return response_success(
        data=summary_data,
        message="Data ringkasan dashboard berhasil diambil."
    )
