from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.database.database import get_db
from app.models.zones import Zone
from app.models.sensor_data import SensorData
from app.models.citizen_reports import CitizenReport
from app.models.volume_predictions import VolumePrediction
from app.models.historical_waste_data import HistoricalWasteData
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


@router.get("/dashboard/event-weather-impact")
def get_event_weather_impact(db: Session = Depends(get_db)):
    """
    Mengambil data dampak cuaca dan event terkini dari historical_waste_data.
    Digunakan untuk section Event & Weather Impact di halaman Overview.
    """
    today = datetime.now().date()
    today_start = datetime.combine(today, datetime.min.time())

    # Ambil data terbaru untuk hari ini
    latest_records = (
        db.query(HistoricalWasteData)
        .filter(HistoricalWasteData.timestamp_prediction >= today_start)
        .all()
    )

    # Jika tidak ada data hari ini, ambil yang paling baru secara keseluruhan
    if not latest_records:
        latest_ts = (
            db.query(func.max(HistoricalWasteData.timestamp_prediction))
            .scalar()
        )
        if latest_ts:
            latest_records = (
                db.query(HistoricalWasteData)
                .filter(HistoricalWasteData.timestamp_prediction >= latest_ts - timedelta(hours=24))
                .all()
            )

    if not latest_records:
        return response_success(
            data={
                "avg_rainfall": 0,
                "max_event_urgency": 0,
                "avg_event_urgency": 0,
                "tps_affected_by_rain": 0,
                "tps_high_event_urgency": 0,
                "total_tps": 0,
                "avg_daily_growth_rate": 0,
                "avg_current_fill": 0,
                "rain_by_kecamatan": [],
                "event_by_kecamatan": [],
                "top_growth_tps": [],
                "timestamp": None,
            },
            message="Belum ada data historical waste.",
        )

    # Agregasi global
    avg_rainfall = sum(r.rainfall_today or 0 for r in latest_records) / len(latest_records)
    event_scores = [r.event_urgency_score or 0 for r in latest_records]
    max_event_urgency = max(event_scores) if event_scores else 0
    avg_event_urgency = sum(event_scores) / len(event_scores) if event_scores else 0
    tps_affected_by_rain = sum(1 for r in latest_records if (r.rainfall_today or 0) > 0)
    tps_high_event_urgency = sum(1 for r in latest_records if (r.event_urgency_score or 0) >= 0.7)
    total_tps = len(latest_records)
    avg_daily_growth = sum(r.daily_growth_rate or 0 for r in latest_records) / total_tps
    avg_current_fill = sum(r.current_fill_percentage or 0 for r in latest_records) / total_tps

    # Build zone -> kecamatan name lookup
    all_zone_ids = list(set(r.tps_id for r in latest_records if r.tps_id))
    zone_map = {}
    if all_zone_ids:
        zones = db.query(Zone).filter(Zone.id.in_(all_zone_ids)).all()
        zone_map = {z.id: z.kecamatan for z in zones if z.kecamatan}

    def _resolve_kec(tps_id, raw_kec):
        if tps_id and tps_id in zone_map:
            return zone_map[tps_id]
        return str(raw_kec).strip() if raw_kec else "Unknown"

    # Agregasi per kecamatan
    rain_by_kecamatan = {}
    event_by_kecamatan = {}
    for r in latest_records:
        k = _resolve_kec(r.tps_id, r.kecamatan)
        if k not in rain_by_kecamatan:
            rain_by_kecamatan[k] = {"total_rain": 0, "count": 0}
            event_by_kecamatan[k] = {"total_event": 0, "count": 0, "max_event": 0}
        rain_by_kecamatan[k]["total_rain"] += r.rainfall_today or 0
        rain_by_kecamatan[k]["count"] += 1
        event_by_kecamatan[k]["total_event"] += r.event_urgency_score or 0
        event_by_kecamatan[k]["count"] += 1
        event_by_kecamatan[k]["max_event"] = max(
            event_by_kecamatan[k]["max_event"], r.event_urgency_score or 0
        )

    rain_list = [
        {
            "kecamatan": k,
            "avg_rainfall": round(v["total_rain"] / v["count"], 1),
            "tps_count": v["count"],
        }
        for k, v in sorted(rain_by_kecamatan.items(), key=lambda x: x[1]["total_rain"], reverse=True)
    ]

    event_list = [
        {
            "kecamatan": k,
            "avg_event_urgency": round(v["total_event"] / v["count"], 2),
            "max_event_urgency": round(v["max_event"], 2),
            "tps_count": v["count"],
        }
        for k, v in sorted(event_by_kecamatan.items(), key=lambda x: x[1]["total_event"], reverse=True)
    ]

    # Top 5 TPS dengan pertumbuhan harian tertinggi
    top_growth = sorted(latest_records, key=lambda r: r.daily_growth_rate or 0, reverse=True)[:5]
    top_growth_tps = [
        {
            "tps_id": r.tps_id,
            "kecamatan": _resolve_kec(r.tps_id, r.kecamatan),
            "daily_growth_rate": round(r.daily_growth_rate or 0, 2),
            "current_fill_percentage": round(r.current_fill_percentage or 0, 1),
            "rainfall_today": round(r.rainfall_today or 0, 1),
        }
        for r in top_growth
    ]

    latest_ts = max(r.timestamp_prediction for r in latest_records if r.timestamp_prediction)

    return response_success(
        data={
            "avg_rainfall": round(avg_rainfall, 1),
            "max_event_urgency": round(max_event_urgency, 2),
            "avg_event_urgency": round(avg_event_urgency, 2),
            "tps_affected_by_rain": tps_affected_by_rain,
            "tps_high_event_urgency": tps_high_event_urgency,
            "total_tps": total_tps,
            "avg_daily_growth_rate": round(avg_daily_growth, 2),
            "avg_current_fill": round(avg_current_fill, 1),
            "rain_by_kecamatan": rain_list,
            "event_by_kecamatan": event_list,
            "top_growth_tps": top_growth_tps,
            "timestamp": latest_ts.isoformat() if latest_ts else None,
        },
        message="Data dampak cuaca & event berhasil diambil.",
    )
