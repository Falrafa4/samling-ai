from fastapi import APIRouter, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta, timezone

from app.database.database import get_db
from app.models.sensor_data import SensorData
from app.models.zones import Zone
from app.models.users import User
from app.schemas.sensor_data import SensorDataCreate, SensorDataResponse, SensorDataBulkResponse, SensorDataUpdate
from app.api.deps import get_current_user
from app.utils.response import response_success
from app.api.websocket_manager import manager

router = APIRouter(tags=["sensor-data"])

@router.post("/sensor-data", status_code=status.HTTP_201_CREATED)
async def create_sensor_data(sensor_data_in: SensorDataCreate, db: Session = Depends(get_db)):
    """
    Membuat Data Sensor (Endpoint Publik untuk IoT Device).
    
    Secara dinamis memperbarui risk_status dari wilayah terkait berdasarkan fill_percentage:
    - _>80% -> High Priority
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

    # 2. Selalu simpan sebagai baris baru untuk membangun data deret waktu (time-series log)
    now = datetime.now()
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

    # 4. Broadcast data terbaru melalui WebSocket
    try:
        await manager.broadcast({
            "event": "sensor_update",
            "data": {
                "id": sensor_record.id,
                "zone_id": sensor_record.zone_id,
                "sensor_type": sensor_record.sensor_type,
                "fill_percentage": float(sensor_record.fill_percentage),
                "value": float(sensor_record.value),
                "created_at": sensor_record.created_at.isoformat() if sensor_record.created_at else None,
                "updated_at": sensor_record.updated_at.isoformat() if sensor_record.updated_at else None,
                "zone_risk_status": zone.risk_status if zone else "Normal"
            }
        })
    except Exception as ws_err:
        # Jangan memblokir atau menggagalkan HTTP response jika penyiaran WS bermasalah
        pass

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

@router.get("/sensor-data", response_model=None)
def get_all_sensor_data(
    zone_id: Optional[int] = Query(None),
    sensor_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mengambil semua data pembacaan sensor (Master Data).
    """
    query = db.query(SensorData).options(joinedload(SensorData.zone))
    if zone_id is not None:
        query = query.filter(SensorData.zone_id == zone_id)
    if sensor_type is not None:
        query = query.filter(SensorData.sensor_type == sensor_type)
    
    records = query.order_by(SensorData.created_at.desc()).all()
    data = [SensorDataResponse.model_validate(record) for record in records]
    return response_success(data=data, message="Semua data sensor berhasil diambil.")

@router.get("/sensor-data/{id}", response_model=None)
def get_sensor_data_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mengambil detail data sensor berdasarkan ID.
    """
    record = db.query(SensorData).options(joinedload(SensorData.zone)).filter(SensorData.id == id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data sensor tidak ditemukan."
        )
    data = SensorDataResponse.model_validate(record)
    return response_success(data=data, message="Detail data sensor berhasil diambil.")

@router.post("/sensor-data/manual", status_code=status.HTTP_201_CREATED)
def create_sensor_data_manually(
    sensor_in: SensorDataCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Menambahkan data sensor secara manual.
    """
    zone = db.query(Zone).filter(Zone.id == sensor_in.zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Zone dengan ID {sensor_in.zone_id} tidak terdaftar di sistem."
        )
    
    existing = db.query(SensorData).filter(
        SensorData.zone_id == sensor_in.zone_id,
        SensorData.sensor_type == sensor_in.sensor_type
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sensor tipe '{sensor_in.sensor_type}' sudah terpasang di wilayah {zone.name}."
        )

    now = datetime.now()
    new_record = SensorData(
        zone_id=sensor_in.zone_id,
        sensor_type=sensor_in.sensor_type,
        fill_percentage=sensor_in.fill_percentage,
        value=sensor_in.value,
        created_at=now,
        updated_at=now
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    if sensor_in.sensor_type.startswith("Ultrasonic"):
        all_ultrasonic = db.query(SensorData).filter(
            SensorData.zone_id == sensor_in.zone_id,
            SensorData.sensor_type.like("Ultrasonic%")
        ).all()
        max_fill = max([s.fill_percentage for s in all_ultrasonic])
        if max_fill > 80.0:
            zone.risk_status = "High Priority"
        elif max_fill >= 50.0:
            zone.risk_status = "Warning"
        else:
            zone.risk_status = "Normal"
        db.commit()

    new_record_loaded = db.query(SensorData).options(joinedload(SensorData.zone)).filter(SensorData.id == new_record.id).first()
    data = SensorDataResponse.model_validate(new_record_loaded)
    return response_success(data=data, message="Data sensor baru berhasil ditambahkan.")

@router.put("/sensor-data/{id}", response_model=None)
def update_sensor_data_manually(
    id: int,
    sensor_in: SensorDataUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Memperbarui data sensor secara manual.
    """
    record = db.query(SensorData).filter(SensorData.id == id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data sensor tidak ditemukan."
        )

    if sensor_in.zone_id is not None:
        zone = db.query(Zone).filter(Zone.id == sensor_in.zone_id).first()
        if not zone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Zone dengan ID {sensor_in.zone_id} tidak ditemukan."
            )
        record.zone_id = sensor_in.zone_id

    target_zone_id = sensor_in.zone_id or record.zone_id
    target_type = sensor_in.sensor_type or record.sensor_type
    if sensor_in.zone_id is not None or sensor_in.sensor_type is not None:
        existing = db.query(SensorData).filter(
            SensorData.zone_id == target_zone_id,
            SensorData.sensor_type == target_type,
            SensorData.id != id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sensor tipe '{target_type}' sudah terpasang di wilayah tersebut."
            )

    if sensor_in.sensor_type is not None:
        record.sensor_type = sensor_in.sensor_type
    if sensor_in.fill_percentage is not None:
        record.fill_percentage = sensor_in.fill_percentage
    if sensor_in.value is not None:
        record.value = sensor_in.value
    
    record.updated_at = datetime.now()
    db.commit()

    zone = db.query(Zone).filter(Zone.id == target_zone_id).first()
    if zone and target_type.startswith("Ultrasonic"):
        all_ultrasonic = db.query(SensorData).filter(
            SensorData.zone_id == target_zone_id,
            SensorData.sensor_type.like("Ultrasonic%")
        ).all()
        max_fill = max([s.fill_percentage for s in all_ultrasonic])
        if max_fill > 80.0:
            zone.risk_status = "High Priority"
        elif max_fill >= 50.0:
            zone.risk_status = "Warning"
        else:
            zone.risk_status = "Normal"
        db.commit()

    db.refresh(record)
    record_loaded = db.query(SensorData).options(joinedload(SensorData.zone)).filter(SensorData.id == record.id).first()
    data = SensorDataResponse.model_validate(record_loaded)
    return response_success(data=data, message="Data sensor berhasil diperbarui.")

@router.delete("/sensor-data/{id}", response_model=None)
def delete_sensor_data(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Menghapus data sensor.
    """
    record = db.query(SensorData).filter(SensorData.id == id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data sensor tidak ditemukan."
        )

    zone_id = record.zone_id
    sensor_type = record.sensor_type

    db.delete(record)
    db.commit()

    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if zone and sensor_type.startswith("Ultrasonic"):
        all_ultrasonic = db.query(SensorData).filter(
            SensorData.zone_id == zone_id,
            SensorData.sensor_type.like("Ultrasonic%")
        ).all()
        if all_ultrasonic:
            max_fill = max([s.fill_percentage for s in all_ultrasonic])
            if max_fill > 80.0:
                zone.risk_status = "High Priority"
            elif max_fill >= 50.0:
                zone.risk_status = "Warning"
            else:
                zone.risk_status = "Normal"
        else:
            zone.risk_status = "Normal"
        db.commit()

    return response_success(message="Data sensor berhasil dihapus dari sistem.")

@router.websocket("/ws/sensor")
async def websocket_sensor_endpoint(websocket: WebSocket):
    """
    WebSocket Endpoint untuk pemantauan data sensor real-time.
    Klien mendaftar di sini untuk mendapatkan pembaruan otomatis.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Jaga koneksi persisten tetap terbuka dengan menerima pesan heartbeat/ping dari client
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
