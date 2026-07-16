from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Dict, Any

from app.database.database import get_db
from app.models.zones import Zone
from app.models.sensor_data import SensorData
from app.models.fleets import Fleet
from app.utils.timezone import get_jakarta_now
from app.utils.response import response_success

router = APIRouter(tags=["landing"])

def get_ispu_status(value: float) -> str:
    if value <= 50:
        return "Baik"
    elif value <= 100:
        return "Sedang"
    elif value <= 200:
        return "Tidak Sehat"
    elif value <= 300:
        return "Sangat Tidak Sehat"
    else:
        return "Berbahaya"

@router.get("/landing/summary")
def get_landing_summary(db: Session = Depends(get_db)):
    """
    Mengambil data ringkasan metrik untuk Landing Page (Public Endpoint).
    Menghitung metrik real-time kapasitas sampah, unit truk operasional,
    kualitas udara ISPU terbaik/terburuk, serta memproyeksikan event terdekat.
    """
    now = get_jakarta_now()

    # 1. Cari Event Terdekat secara Dinamis
    events = [
        {"name": "Hari Raya Kemerdekaan (HUT RI)", "date": datetime(2026, 8, 17, 0, 0), "increase": "+10%"},
        {"name": "Hari Raya Natal & Tahun Baru", "date": datetime(2026, 12, 25, 0, 0), "increase": "+12%"},
        {"name": "Tahun Baru 2027", "date": datetime(2027, 1, 1, 0, 0), "increase": "+15%"},
        {"name": "Hari Raya Lebaran (Idul Fitri)", "date": datetime(2027, 3, 20, 0, 0), "increase": "+15%"},
        {"name": "HUT DKI Jakarta", "date": datetime(2027, 6, 22, 0, 0), "increase": "+10%"},
    ]
    
    closest_event = None
    for ev in events:
        if ev["date"] >= now:
            closest_event = ev
            break
            
    if not closest_event:
        # Fallback dinamis jika semua tanggal terlampaui
        closest_event = {
            "name": "Hari Raya Lebaran (Idul Fitri)",
            "date": datetime(now.year + 1, 3, 20, 0, 0),
            "increase": "+15%"
        }

    # 2. Ambil Rata-Rata Fill Percentage Terbaru dari Sensor Bak Sampah
    max_ids_query = (
        db.query(func.max(SensorData.id))
        .filter(SensorData.sensor_type.in_(["Ultrasonic-Organic", "Ultrasonic-Anorganic"]))
        .group_by(SensorData.zone_id, SensorData.sensor_type)
    )
    avg_fill = (
        db.query(func.avg(SensorData.fill_percentage))
        .filter(SensorData.id.in_(max_ids_query))
        .scalar()
    ) or 65.0  # Fallback default jika DB kosong

    # Hitung rata-rata kemarin (24-48 jam yang lalu) sebagai pembanding tren
    yesterday_start = now - timedelta(days=2)
    yesterday_end = now - timedelta(days=1)
    yesterday_avg_fill = (
        db.query(func.avg(SensorData.fill_percentage))
        .filter(
            SensorData.sensor_type.in_(["Ultrasonic-Organic", "Ultrasonic-Anorganic"]),
            SensorData.created_at >= yesterday_start,
            SensorData.created_at < yesterday_end
        )
        .scalar()
    ) or 63.5  # Fallback default

    # Hitung perubahan volume sampah harian
    diff_volume_pct = 0.0
    if yesterday_avg_fill > 0:
        diff_volume_pct = ((avg_fill - yesterday_avg_fill) / yesterday_avg_fill) * 100

    # Volume Sampah (TPST) disimulasikan dari persentase bak sampah dikalikan kapasitas harian Bantar Gebang (10.000 ton)
    volume_sampah_ton = int((avg_fill / 100) * 10000)

    # 3. Hitung Total Truk Beroperasi berdasarkan Armada Makro (Tengah)
    total_fleet_units = db.query(func.sum(Fleet.total_units)).filter(Fleet.category == "Tengah").scalar() or 1121
    operating_trucks = int(total_fleet_units * (avg_fill / 100))
    yesterday_operating_trucks = int(total_fleet_units * (yesterday_avg_fill / 100))

    # Hitung perubahan truk beroperasi
    diff_trucks_pct = 0.0
    if yesterday_operating_trucks > 0:
        diff_trucks_pct = ((operating_trucks - yesterday_operating_trucks) / yesterday_operating_trucks) * 100

    # 4. Cari ISPU Terbaik & Terburuk dari Sensor MQ-135 Terbaru
    latest_mq135_ids = (
        db.query(func.max(SensorData.id))
        .filter(SensorData.sensor_type == "MQ-135")
        .group_by(SensorData.zone_id)
    )
    latest_mq135_readings = (
        db.query(SensorData)
        .join(Zone, SensorData.zone_id == Zone.id)
        .filter(SensorData.id.in_(latest_mq135_ids))
        .all()
    )

    best_air = {"value": 42.0, "status": "Baik", "location": "Jakarta Selatan (Jagakarsa)"}
    worst_air = {"value": 115.0, "status": "Tidak Sehat", "location": "Jakarta Timur (Cipayung)"}

    if latest_mq135_readings:
        # Urutkan berdasarkan nilai MQ-135 (semakin kecil semakin baik)
        latest_mq135_readings.sort(key=lambda x: x.value)
        
        best_record = latest_mq135_readings[0]
        best_air = {
            "value": round(float(best_record.value), 1),
            "status": get_ispu_status(best_record.value),
            "location": f"{best_record.zone.wilayah} ({best_record.zone.name})"
        }
        
        worst_record = latest_mq135_readings[-1]
        worst_air = {
            "value": round(float(worst_record.value), 1),
            "status": get_ispu_status(worst_record.value),
            "location": f"{worst_record.zone.wilayah} ({worst_record.zone.name})"
        }

    summary_data = {
        "event_alert": {
            "name": closest_event["name"],
            "increase": closest_event["increase"],
            "target_date": closest_event["date"].isoformat()
        },
        "volume_sampah": {
            "value": volume_sampah_ton,
            "trend": f"{diff_volume_pct:+.1f}%"
        },
        "truk_beroperasi": {
            "value": operating_trucks,
            "trend": f"{diff_trucks_pct:+.1f}%"
        },
        "udara_terbaik": best_air,
        "udara_terburuk": worst_air
    }

    return response_success(
        data=summary_data,
        message="Data ringkasan landing page berhasil diambil."
    )