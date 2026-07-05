from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import List

from app.database.database import get_db
from app.models.volume_predictions import VolumePrediction
from app.models.zones import Zone
from app.schemas.volume_predictions import VolumePredictionCreate, VolumePredictionResponse
from app.api.deps import get_current_user
from app.utils.response import response_success

router = APIRouter(tags=["volume-predictions"])

@router.post("/volume-predictions", status_code=status.HTTP_201_CREATED)
def create_volume_prediction(prediction_in: VolumePredictionCreate, db: Session = Depends(get_db)):
    """
    Simpan Hasil Prediksi AI (Endpoint Publik untuk Internal Cron Job / AI Engine).
    Memvalidasi zone_id sebelum menyimpan data.
    """
    # 1. Validasi zone_id ada di database
    zone = db.query(Zone).filter(Zone.id == prediction_in.zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Zone dengan ID {prediction_in.zone_id} tidak terdaftar di sistem."
        )

    # 2. Simpan data prediksi
    new_prediction = VolumePrediction(
        zone_id=prediction_in.zone_id,
        predicted_volume=prediction_in.predicted_volume,
        target_time=prediction_in.target_time,
        confidence_score=prediction_in.confidence_score
    )
    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)

    data = VolumePredictionResponse.model_validate(new_prediction)
    return response_success(data=data, message="Hasil prediksi AI berhasil disimpan.")

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
