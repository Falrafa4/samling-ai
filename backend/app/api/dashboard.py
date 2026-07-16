from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.models.zones import Zone
from app.models.sensor_data import SensorData
from app.models.citizen_reports import CitizenReport
from app.models.volume_predictions import VolumePrediction
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

    # 4. Tambahan Fitur AI Forecast Center (Tahap 1)
    # Cari batch_id prediksi terakhir
    latest_batch_id = (
        db.query(VolumePrediction.forecast_batch_id)
        .order_by(VolumePrediction.created_at.desc())
        .limit(1)
        .scalar()
    )

    tps_predicted_warning_critical_count = 0
    tps_predicted_critical_90_count = 0
    top_10_critical_predictions = []

    if latest_batch_id:
        # Hitung TPS diprediksi WARNING atau CRITICAL (atau Waspada/Awas dari data seed)
        tps_predicted_warning_critical_count = (
            db.query(VolumePrediction)
            .filter(
                VolumePrediction.forecast_batch_id == latest_batch_id,
                VolumePrediction.prediction_status.in_(["WARNING", "CRITICAL", "Waspada", "Awas"])
            )
            .count()
        )

        # Hitung TPS berstatus Critical (>= 90%)
        tps_predicted_critical_90_count = (
            db.query(VolumePrediction)
            .filter(
                VolumePrediction.forecast_batch_id == latest_batch_id,
                VolumePrediction.predicted_volume_percentage >= 90.0
            )
            .count()
        )

        # Top 10 TPS dengan proyeksi volume sampah tertinggi
        top_10_preds = (
            db.query(VolumePrediction, Zone.name.label("zone_name"))
            .join(Zone, Zone.id == VolumePrediction.tps_id)
            .filter(VolumePrediction.forecast_batch_id == latest_batch_id)
            .order_by(VolumePrediction.predicted_volume_percentage.desc())
            .limit(10)
            .all()
        )

        for pred, zone_name in top_10_preds:
            top_10_critical_predictions.append({
                "tps_id": pred.tps_id,
                "tps_name": zone_name or f"TPS ID {pred.tps_id}",
                "kecamatan": pred.kecamatan,
                "predicted_volume_percentage": round(pred.predicted_volume_percentage, 2),
                "prediction_status": pred.prediction_status
            })

    summary_data = {
        "alert_zones_count": alert_zones_count,
        "average_fill_percentage": round(float(average_fill_percentage), 2),
        "total_citizen_reports": total_citizen_reports,
        "tps_predicted_warning_critical_count": tps_predicted_warning_critical_count,
        "tps_predicted_critical_90_count": tps_predicted_critical_90_count,
        "top_10_critical_predictions": top_10_critical_predictions
    }

    return response_success(
        data=summary_data,
        message="Data ringkasan dashboard berhasil diambil."
    )
