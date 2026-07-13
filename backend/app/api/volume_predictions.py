from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from datetime import datetime, timedelta, timezone
from typing import List, Optional
import os, joblib
import pandas as pd

from app.database.database import get_db
from app.models.volume_predictions import VolumePrediction
from app.models.zones import Zone
from app.schemas.volume_predictions import VolumePredictionCreate, VolumePredictionResponse
from app.api.deps import get_current_user
from app.utils.response import response_success

# Load AI Model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ai", "models", "waste_volume", "forecast_waste_volume_model.pkl")
ENCODERS_PATH = os.path.join(os.path.dirname(__file__), "..", "ai", "models", "waste_volume", "encoders.pkl")
MODEL_VERSION = os.path.splitext(os.path.split(MODEL_PATH)[1])[0]
try:
    model = joblib.load(MODEL_PATH)
    encoders = joblib.load(ENCODERS_PATH)
except Exception as e:
    model = None
    encoders = None
    print(f"Error loading ML model: {e}")

router = APIRouter(tags=["volume-predictions"])

@router.post("/volume-predictions", status_code=status.HTTP_201_CREATED)
def create_volume_prediction(prediction_in: VolumePredictionCreate, db: Session = Depends(get_db)):
    """
    Simpan Hasil Prediksi AI (Endpoint Publik untuk Internal Cron Job / AI Engine).
    Memvalidasi zone_id sebelum menyimpan data.
    """
    # 1. Validasi zone_id ada di database
    zone = db.query(Zone).filter(Zone.id == prediction_in.tps_id).first()

    if not zone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Zone dengan ID {prediction_in.tps_id} tidak terdaftar di sistem."
        )

    if model is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model AI tidak berhasil dimuat."
        )

    # 2. Lakukan Prediksi (Inference)
    features = pd.DataFrame([{
        "kecamatan": prediction_in.kecamatan,
        "tps_id": prediction_in.tps_id,
        "tps_type": prediction_in.tps_type,
        "zone_population": prediction_in.zone_population,
        "tps_capacity_kg": prediction_in.tps_capacity_kg,
        "day_of_week": prediction_in.day_of_week,
        "is_weekend": prediction_in.is_weekend,
        "is_holiday": prediction_in.is_holiday,
        "daily_growth_rate": prediction_in.daily_growth_rate,
        "rainfall_today": prediction_in.rainfall_today,
        "event_urgency_score": prediction_in.event_urgency_score,
        "current_fill_percentage": prediction_in.current_fill_percentage
    }])
    
    df_features = pd.DataFrame(features)
    
    # Apply encoders
    for col in ["kecamatan", "tps_type"]:
        df_features[col] = encoders[col].transform(df_features[col])
        
    try:
        predicted_volume_percentage = float(model.predict(df_features)[0])
        predicted_volume_percentage = max(
            0.0,
            min(100.0, predicted_volume_percentage)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Inference failed: {str(e)}")
    
    forecast_batch_id = f"batch_{datetime.now():%Y%m%d_%H%M%S}"

    prediction_status = ""

    if predicted_volume_percentage >= 90:
        prediction_status = "CRITICAL"
    elif predicted_volume_percentage >= 70:
        prediction_status = "WARNING"
    else:
        prediction_status = "NORMAL"

    # 3. Simpan data prediksi
    new_prediction = VolumePrediction(
        forecast_batch_id=forecast_batch_id,
        kecamatan=prediction_in.kecamatan,
        tps_id=prediction_in.tps_id,
        predicted_volume_percentage=predicted_volume_percentage,
        priority_rank=None,
        prediction_status=prediction_status,
        model_version=MODEL_VERSION,
    )

    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)

    data = VolumePredictionResponse.model_validate(new_prediction)
    return response_success(data=data, message="Hasil prediksi AI berhasil disimpan.")

@router.get("/volume-predictions", response_model=List[VolumePredictionResponse])
def get_volume_predictions(db: Session = Depends(get_db)):
    """
    Mengambil semua data proyeksi volume sampah (Memerlukan Autentikasi).
    Menyaring target_time dari sekarang s.d 7 hari ke depan, diurutkan ascending.
    """
    projections = db.query(VolumePrediction).all()
    data = [VolumePredictionResponse.model_validate(p) for p in projections]
    return response_success(data=data, message="Data proyeksi volume sampah berhasil diambil.")

@router.get("/volume-predictions/{zone_id}/projections")
def get_volume_projections(
    zone_id: int, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """
    Mengambil data proyeksi volume sampah 7 hari ke depan untuk wilayah tertentu (Memerlukan Autentikasi).
    Menyaring target_time dari sekarang s.d 7 hari ke depan, diurutkan ascending.
    """
    # 1. Validasi zone_id ada di database
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Zone dengan ID {zone_id} tidak ditemukan."
        )

    # 2. Filter rentang waktu 7 hari ke depan (menggunakan UTC naive datetime agar kompatibel dengan database SQLite)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    seven_days_later = now + timedelta(days=7)

    projections = (
        db.query(VolumePrediction)
        .filter(
            VolumePrediction.zone_id == zone_id,
            VolumePrediction.target_time >= now,
            VolumePrediction.target_time <= seven_days_later
        )
        .order_by(VolumePrediction.target_time.asc())
        .all()
    )

    data = [VolumePredictionResponse.model_validate(p) for p in projections]
    return response_success(data=data, message="Data proyeksi volume sampah 7 hari berhasil diambil.")

@router.get("/volume-predictions/summary")
def get_predictions_summary(db: Session = Depends(get_db)):
    """
    Statistik agregat prediksi AI (Endpoint Publik).
    Mengembalikan rata-rata confidence, total prediksi, dan zona dengan akurasi terendah.
    """
    # Total prediksi yang pernah dibuat
    total_predictions = db.query(sql_func.count(VolumePrediction.id)).scalar() or 0

    # Rata-rata confidence score global
    avg_confidence = db.query(sql_func.avg(VolumePrediction.confidence_score)).scalar()
    avg_confidence = round(float(avg_confidence), 4) if avg_confidence else 0.0

    # Zona dengan rata-rata confidence terendah
    lowest_zone = (
        db.query(
            VolumePrediction.zone_id,
            sql_func.avg(VolumePrediction.confidence_score).label("avg_conf")
        )
        .group_by(VolumePrediction.zone_id)
        .order_by(sql_func.avg(VolumePrediction.confidence_score).asc())
        .first()
    )

    lowest_zone_data = None
    if lowest_zone:
        zone = db.query(Zone).filter(Zone.id == lowest_zone.zone_id).first()
        lowest_zone_data = {
            "zone_id": lowest_zone.zone_id,
            "zone_name": zone.name if zone else "Unknown",
            "avg_confidence": round(float(lowest_zone.avg_conf), 4)
        }

    # Total prediksi 7 hari ke depan (yang masih relevan)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    seven_days_later = now + timedelta(days=7)
    upcoming_predictions = (
        db.query(sql_func.count(VolumePrediction.id))
        .filter(
            VolumePrediction.target_time >= now,
            VolumePrediction.target_time <= seven_days_later
        )
        .scalar() or 0
    )

    summary = {
        "total_predictions": total_predictions,
        "avg_confidence_score": avg_confidence,
        "upcoming_predictions_7d": upcoming_predictions,
        "lowest_accuracy_zone": lowest_zone_data
    }

    return response_success(data=summary, message="Ringkasan prediksi AI berhasil diambil.")


@router.get("/volume-predictions/multi-zone")
def get_multi_zone_projections(
    zone_ids: str = Query(..., description="Comma-separated zone IDs, contoh: 1,2,3"),
    days: int = Query(7, ge=1, le=30, description="Jumlah hari ke depan"),
    db: Session = Depends(get_db)
):
    """
    Proyeksi volume sampah multi-zona sekaligus (Endpoint Publik).
    Mengembalikan data grouped per zona.
    """
    try:
        id_list = [int(x.strip()) for x in zone_ids.split(",") if x.strip()]
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format zone_ids tidak valid. Gunakan format: 1,2,3"
        )

    if not id_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimal satu zone_id harus diberikan."
        )

    # Validasi zona exists
    zones = db.query(Zone).filter(Zone.id.in_(id_list)).all()
    zone_map = {z.id: z.name for z in zones}

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    end_date = now + timedelta(days=days)

    predictions = (
        db.query(VolumePrediction)
        .filter(
            VolumePrediction.zone_id.in_(id_list),
            VolumePrediction.target_time >= now,
            VolumePrediction.target_time <= end_date
        )
        .order_by(VolumePrediction.zone_id, VolumePrediction.target_time.asc())
        .all()
    )

    # Group by zone
    grouped = {}
    for p in predictions:
        zid = p.zone_id
        if zid not in grouped:
            grouped[zid] = {
                "zone_id": zid,
                "zone_name": zone_map.get(zid, "Unknown"),
                "projections": []
            }
        grouped[zid]["projections"].append(
            VolumePredictionResponse.model_validate(p).model_dump()
        )

    # Include zones with no predictions
    for zid in id_list:
        if zid not in grouped and zid in zone_map:
            grouped[zid] = {
                "zone_id": zid,
                "zone_name": zone_map[zid],
                "projections": []
            }

    data = list(grouped.values())
    return response_success(data=data, message="Proyeksi multi-zona berhasil diambil.")


@router.get("/volume-predictions/history")
def get_predictions_history(
    page: int = Query(1, ge=1, description="Nomor halaman"),
    per_page: int = Query(20, ge=1, le=100, description="Jumlah data per halaman"),
    zone_id: Optional[int] = Query(None, description="Filter berdasarkan zone ID"),
    db: Session = Depends(get_db)
):
    """
    Riwayat semua prediksi AI dengan pagination (Endpoint Publik).
    """
    query = db.query(VolumePrediction)

    if zone_id is not None:
        query = query.filter(VolumePrediction.zone_id == zone_id)

    # Total count for pagination
    total = query.count()

    # Paginated results
    predictions = (
        query
        .order_by(VolumePrediction.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    # Enrich with zone names
    zone_ids_in_result = list(set(p.zone_id for p in predictions))
    zones = db.query(Zone).filter(Zone.id.in_(zone_ids_in_result)).all() if zone_ids_in_result else []
    zone_map = {z.id: z.name for z in zones}

    items = []
    for p in predictions:
        item = VolumePredictionResponse.model_validate(p).model_dump()
        item["zone_name"] = zone_map.get(p.zone_id, "Unknown")
        items.append(item)

    data = {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, -(-total // per_page))  # ceil division
    }

    return response_success(data=data, message="Riwayat prediksi AI berhasil diambil.")


@router.get("/volume-predictions/accuracy-trend")
def get_accuracy_trend(
    days: int = Query(30, ge=7, le=90, description="Jumlah hari ke belakang"),
    db: Session = Depends(get_db)
):
    """
    Tren rata-rata confidence score per hari (Endpoint Publik).
    Mengembalikan data point per hari selama N hari terakhir.
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    start_date = now - timedelta(days=days)

    predictions = (
        db.query(VolumePrediction)
        .filter(VolumePrediction.created_at >= start_date)
        .order_by(VolumePrediction.created_at.asc())
        .all()
    )

    # Group by date (YYYY-MM-DD) and compute daily average confidence
    daily_data = {}
    for p in predictions:
        if p.created_at is None:
            continue
        day_key = p.created_at.strftime("%Y-%m-%d")
        if day_key not in daily_data:
            daily_data[day_key] = {"sum": 0.0, "count": 0}
        daily_data[day_key]["sum"] += (p.confidence_score or 0.0)
        daily_data[day_key]["count"] += 1

    trend = []
    for day_key in sorted(daily_data.keys()):
        entry = daily_data[day_key]
        trend.append({
            "date": day_key,
            "avg_confidence": round(entry["sum"] / entry["count"], 4) if entry["count"] > 0 else 0.0,
            "prediction_count": entry["count"]
        })

    return response_success(data=trend, message="Tren akurasi AI berhasil diambil.")