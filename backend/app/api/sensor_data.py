from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from app.database.database import get_db
from app.models.sensor_data import SensorData
from app.models.zones import Zone
from app.schemas.sensor_data import SensorDataCreate, SensorDataResponse, SensorDataBulkResponse
from app.api.deps import get_current_user
from app.utils.response import response_success

router = APIRouter(tags=["sensor-data"])

@router.put("/sensor-data", status_code=status.HTTP_200_OK)
def update_sensor_data(sensor_data_in: SensorDataCreate, db: Session = Depends(get_db)):
    """
    Perbarui Data Sensor (Endpoint Publik untuk IoT Device).
    Jika data sensor dengan zone_id dan sensor_type tersebut sudah ada, perbarui nilainya.
    Jika belum ada, buat baru (Upsert).
    Secara dinamis memperbarui risk_status dari wilayah terkait berdasarkan fill_percentage:
    - > 80% -> High Priority
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

    # 2. Cari data sensor lama untuk diperbarui (Upsert)
    sensor_record = (
        db.query(SensorData)
        .filter(
            SensorData.zone_id == sensor_data_in.zone_id,
            SensorData.sensor_type == sensor_data_in.sensor_type
        )
        .first()
    )

    now = datetime.now()
    if sensor_record:
        # Update existing record
        sensor_record.fill_percentage = sensor_data_in.fill_percentage
        sensor_record.value = sensor_data_in.value
        sensor_record.updated_at = now # Atur waktu terupdate
    else:
        # Create new record
        sensor_record = SensorData(
            zone_id=sensor_data_in.zone_id,
            sensor_type=sensor_data_in.sensor_type,
            fill_percentage=sensor_data_in.fill_percentage,
            value=sensor_data_in.value,
            created_at=now,
            updated_at=now
        )
        db.add(sensor_record)

    # 3. Logika Pembaruan Status Wilayah (Dinamis Penuh)
    if sensor_data_in.sensor_type.startswith("Ultrasonic"):
        db.flush() # Sinkronisasi state memori ke database transaksi
        ultrasonic_sensors = (
            db.query(SensorData)
            .filter(
                SensorData.zone_id == sensor_data_in.zone_id,
                SensorData.sensor_type.like("Ultrasonic%")
            )
            .all()
        )
        max_fill = max([s.fill_percentage for s in ultrasonic_sensors] + [sensor_data_in.fill_percentage])

        if max_fill > 80.0:
            zone.risk_status = "High Priority"
        elif max_fill >= 50.0:
            zone.risk_status = "Warning"
        else:
            zone.risk_status = "Normal"

    db.commit()
    db.refresh(sensor_record)

    data = SensorDataResponse.model_validate(sensor_record)
    return response_success(data=data, message="Data sensor berhasil diperbarui dan status wilayah berhasil disinkronkan.")

@router.get("/sensor-data/latest")
def get_latest_sensor_data(
    zone_id: Optional[int] = Query(None, description="Filter berdasarkan ID wilayah TPS"),
    db: Session = Depends(get_db)
):
    """
    Mengambil pembacaan data sensor terakhir untuk semua wilayah TPS (Mendukung filter zone_id).
    Menghasilkan maksimal 1 data sensor terbaru untuk setiap zone_id dan sensor_type.
    """
    # Query untuk mengambil ID terbesar (terbaru) per zone_id dan sensor_type
    max_ids_query = (
        db.query(func.max(SensorData.id))
        .group_by(SensorData.zone_id, SensorData.sensor_type)
    )
    
    if zone_id is not None:
        max_ids_query = max_ids_query.filter(SensorData.zone_id == zone_id)
        
        # Mengambil objek SensorData dengan eager loading zone (karena zone spesifik diminta)
        latest_records = (
            db.query(SensorData)
            .options(joinedload(SensorData.zone))
            .filter(SensorData.id.in_(max_ids_query))
            .all()
        )
        data = [SensorDataResponse.model_validate(record) for record in latest_records]
    else:
        # Bulk query: tanpa eager loading zone untuk menghemat bandwidth
        latest_records = (
            db.query(SensorData)
            .filter(SensorData.id.in_(max_ids_query))
            .all()
        )
        data = [SensorDataBulkResponse.model_validate(record) for record in latest_records]

    return response_success(data=data, message="Data sensor terbaru per wilayah berhasil diambil.")

@router.get("/sensor-data/history")
def get_sensor_data_history(zone_id: int, days: int = 7, db: Session = Depends(get_db)):
    """
    Mengambil data sensor historis untuk wilayah tertentu (AI Forecasting).
    """
    # 1. Validasi zone_id ada di database
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Zone dengan ID {zone_id} tidak ditemukan."
        )

    # 2. Filter rentang waktu ke belakang (UTC naive datetime untuk SQLite)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    start_date = now - timedelta(days=days)

    history = (
        db.query(SensorData)
        .options(joinedload(SensorData.zone))
        .filter(
            SensorData.zone_id == zone_id,
            SensorData.created_at >= start_date
        )
        .order_by(SensorData.created_at.asc())
        .all()
    )

    data = [SensorDataResponse.model_validate(record) for record in history]
    return response_success(data=data, message="Data historis sensor berhasil diambil.")
