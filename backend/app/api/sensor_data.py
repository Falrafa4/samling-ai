from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List

from app.database.database import get_db
from app.models.sensor_data import SensorData
from app.models.zones import Zone
from app.schemas.sensor_data import SensorDataCreate, SensorDataResponse
from app.api.deps import get_current_user
from app.utils.response import response_success

router = APIRouter(tags=["sensor-data"])

@router.post("/sensor-data", status_code=status.HTTP_201_CREATED)
def create_sensor_data(sensor_data_in: SensorDataCreate, db: Session = Depends(get_db)):
    """
    Kirim Data Sensor Baru (Endpoint Publik untuk IoT Device).
    Secara dinamis memperbarui risk_status dari wilayah terkait berdasarkan fill_percentage:
    - _> 80% -> High Priority
    - 50% - 80% -> Warning
    - < 50% -> Normal
    """
    # 1. Validasi zone_id ada di database
    zone = db.query(Zone).filter(Zone.id == sensor_data_in.zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Zone dengan ID {sensor_data_in.zone_id} tidak terdaftar di sistem."
        )

    # 2. Simpan telemetry data ke database
    new_sensor_data = SensorData(
        zone_id=sensor_data_in.zone_id,
        sensor_type=sensor_data_in.sensor_type,
        fill_percentage=sensor_data_in.fill_percentage,
        value=sensor_data_in.value
    )
    db.add(new_sensor_data)

    # 3. Logika Pembaruan Status Wilayah (Dinamis Penuh)
    if sensor_data_in.fill_percentage > 80.0:
        zone.risk_status = "High Priority"
    elif sensor_data_in.fill_percentage >= 50.0:
        zone.risk_status = "Warning"
    else:
        zone.risk_status = "Normal"

    db.commit()
    db.refresh(new_sensor_data)

    data = SensorDataResponse.model_validate(new_sensor_data)
    return response_success(data=data, message="Data sensor berhasil disimpan dan status wilayah berhasil diperbarui.")

@router.get("/sensor-data/latest")
def get_latest_sensor_data(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Mengambil pembacaan data sensor terakhir untuk semua wilayah TPS (Memerlukan Autentikasi).
    Menghasilkan maksimal 1 data sensor terbaru untuk setiap zone_id.
    """
    # Query untuk mengambil ID terbesar (terbaru) per zone_id
    max_ids_query = (
        db.query(func.max(SensorData.id))
        .group_by(SensorData.zone_id)
    )

    # Mengambil objek SensorData berdasarkan ID yang cocok dengan query (Eager Loading dengan joinedload)
    latest_records = (
        db.query(SensorData)
        .options(joinedload(SensorData.zone))
        .filter(SensorData.id.in_(max_ids_query))
        .all()
    )

    data = [SensorDataResponse.model_validate(record) for record in latest_records]
    return response_success(data=data, message="Data sensor terbaru per wilayah berhasil diambil.")
