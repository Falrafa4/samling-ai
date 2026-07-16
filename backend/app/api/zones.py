from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
import math
from app.database.database import get_db
from app.models.zones import Zone
from app.schemas.zones import ZoneCreate, ZoneUpdate, ZoneResponse
from app.utils.response import response_success
from app.api.deps import get_current_user

router = APIRouter(tags=["zones"])

@router.get("/zones")
def get_zones(
    page: Optional[int] = Query(None, description="Nomor Halaman (1-indexed)"),
    limit: Optional[int] = Query(None, description="Jumlah item per halaman"),
    search: Optional[str] = Query(None, description="Cari berdasarkan nama TPS"),
    wilayah: Optional[str] = Query(None, description="Filter wilayah"),
    kecamatan: Optional[str] = Query(None, description="Filter kecamatan"),
    kelurahan: Optional[str] = Query(None, description="Filter kelurahan"),
    jenis_tps: Optional[str] = Query(None, description="Filter jenis TPS"),
    db: Session = Depends(get_db)
):
    """
    Mengambil daftar wilayah TPS (Mendukung paginasi dan penyaringan).
    """
    from sqlalchemy import exists, case
    from app.models.sensor_data import SensorData

    query = db.query(Zone)
    
    if search:
        query = query.filter(Zone.name.ilike(f"%{search}%"))
    if wilayah:
        query = query.filter(Zone.wilayah == wilayah)
    if kecamatan:
        query = query.filter(Zone.kecamatan == kecamatan)
    if kelurahan:
        query = query.filter(Zone.kelurahan == kelurahan)
    if jenis_tps:
        query = query.filter(Zone.jenis_tps == jenis_tps)
        
    # Sort: TPS with sensor monitoring first, then by risk_status (High Priority -> Warning -> Normal)
    has_sensor = exists().where(SensorData.zone_id == Zone.id)
    risk_priority = case(
        (Zone.risk_status == "High Priority", 1),
        (Zone.risk_status == "Warning", 2),
        (Zone.risk_status == "Normal", 3),
        else_=4
    )
    query = query.order_by(has_sensor.desc(), risk_priority.asc())

    if page is not None and limit is not None:
        total = query.count()
        pages = math.ceil(total / limit) if limit > 0 else 0
        offset = (page - 1) * limit
        zones = query.offset(offset).limit(limit).all()
        
        paginated_data = {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": pages,
            "data": [ZoneResponse.model_validate(z) for z in zones]
        }
        return response_success(data=paginated_data, message="Zones retrieved successfully")
    else:
        zones = query.all()
        data = [ZoneResponse.model_validate(z) for z in zones]
        return response_success(data=data, message="Zones retrieved successfully")

@router.get("/zones/filter-options")
def get_zones_filter_options(
    wilayah: Optional[str] = Query(None, description="Filter opsi berdasarkan wilayah"),
    kecamatan: Optional[str] = Query(None, description="Filter opsi berdasarkan kecamatan"),
    db: Session = Depends(get_db)
):
    """
    Mengambil daftar opsi filter unik yang dapat dibatasi berdasarkan wilayah dan kecamatan.
    """
    wilayahs = [r[0] for r in db.query(Zone.wilayah).distinct().filter(Zone.wilayah != None).all()]

    kecamatan_query = db.query(Zone.kecamatan).distinct().filter(Zone.kecamatan != None)
    kelurahan_query = db.query(Zone.kelurahan).distinct().filter(Zone.kelurahan != None)

    if wilayah:
        kecamatan_query = kecamatan_query.filter(Zone.wilayah == wilayah)
        kelurahan_query = kelurahan_query.filter(Zone.wilayah == wilayah)
    if kecamatan:
        kelurahan_query = kelurahan_query.filter(Zone.kecamatan == kecamatan)

    jenis_tps_list = [r[0] for r in db.query(Zone.jenis_tps).distinct().filter(Zone.jenis_tps != None).all()]

    data = {
        "wilayah": sorted(wilayahs),
        "kecamatan": sorted(r[0] for r in kecamatan_query.all()),
        "kelurahan": sorted(r[0] for r in kelurahan_query.all()),
        "jenis_tps": sorted(jenis_tps_list)
    }
    return response_success(data=data, message="Zones filter options retrieved successfully")

@router.get("/zones/hierarchy", response_model=dict)
def get_zones_hierarchy(db: Session = Depends(get_db)):
    """
    Mengambil seluruh hirarki data TPS DKI Jakarta secara bertingkat:
    Provinsi -> Wilayah (Kota) -> Kecamatan -> Kelurahan -> Daftar TPS.
    Sangat cocok untuk chatbot agar pilihan opsi navigasi bisa langsung dipetakan tanpa input manual.
    """
    zones = db.query(Zone).all()
    
    # Kelompokkan data secara bersarang: wilayah -> kecamatan -> kelurahan -> tps_list
    tree = {}
    for z in zones:
        w = z.wilayah.strip() if z.wilayah else "Lainnya"
        kec = z.kecamatan.strip() if z.kecamatan else "Lainnya"
        kel = z.kelurahan.strip() if z.kelurahan else "Lainnya"
        
        if w not in tree:
            tree[w] = {}
        if kec not in tree[w]:
            tree[w][kec] = {}
        if kel not in tree[w][kec]:
            tree[w][kec][kel] = []
            
        tree[w][kec][kel].append({
            "id": z.id,
            "name": z.name,
            "jenis_tps": z.jenis_tps,
            "alamat": z.alamat,
            "latitude": z.latitude,
            "longitude": z.longitude,
            "risk_status": z.risk_status
        })
        
    # Format tree menjadi bentuk array bersarang untuk kemudahan iterasi di chatbot
    wilayah_list = []
    for w_name, kecs in sorted(tree.items()):
        kec_list = []
        for kec_name, kels in sorted(kecs.items()):
            kel_list = []
            for kel_name, tps_items in sorted(kels.items()):
                kel_list.append({
                    "name": kel_name,
                    "tps": sorted(tps_items, key=lambda x: x["name"])
                })
            kec_list.append({
                "name": kec_name,
                "kelurahan": sorted(kel_list, key=lambda x: x["name"])
            })
        wilayah_list.append({
            "name": w_name,
            "kecamatan": sorted(kec_list, key=lambda x: x["name"])
        })
        
    hierarchy_data = {
        "provinsi": "DKI Jakarta",
        "wilayah": wilayah_list
    }
    
    return response_success(data=hierarchy_data, message="Zones hierarchy retrieved successfully")

@router.get("/zones/{zone_id}")
def get_zone(zone_id: int, db: Session = Depends(get_db)):
    """
    Mengambil detail wilayah TPS berdasarkan ID beserta AI Insights.
    """
    from datetime import date
    from app.models.events import Event
    from app.models.historical_waste_data import HistoricalWasteData

    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
        
    data = ZoneResponse.model_validate(zone)
    
    # --- AI Insight & Risk Assessment Logic ---
    today = date.today()
    is_weekend = today.weekday() >= 5
    
    # 1. Cek Event Aktif di Kecamatan / Wilayah
    active_event = db.query(Event).filter(
        Event.start_date <= today,
        Event.end_date >= today,
        ((Event.kecamatan == zone.kecamatan) | (Event.wilayah == zone.wilayah))
    ).order_by(Event.urgency_score.desc()).first()
    
    # 2. Cek status libur
    is_holiday = False
    if active_event and ("Libur" in active_event.name or "Cuti" in active_event.name or "HUT" in active_event.name):
        is_holiday = True
        
    # 3. Ambil rata-rata curah hujan terakhir untuk TPS ini
    rainfall_record = db.query(HistoricalWasteData.rainfall_today).filter(
        HistoricalWasteData.tps_id == zone.id
    ).order_by(HistoricalWasteData.timestamp_prediction.desc()).first()
    rainfall_mm = rainfall_record[0] if rainfall_record else (15.5 if zone.risk_status in ["Warning", "High Priority"] else 0.0)
    
    # 4. Kalkulasi Faktor Risiko (Risk Factors)
    risk_factors = {
        "historical": 35,
        "holiday": 40 if is_holiday else (15 if active_event else 5),
        "rain": min(40, int(rainfall_mm * 1.5)),
        "weekend": 20 if is_weekend else 5
    }
    
    # Normalisasi agar total = 100%
    total_risk = sum(risk_factors.values())
    if total_risk > 0:
        # Menghindari pembulatan yang membuat total tidak 100%
        normalized_factors = {k: int((v / total_risk) * 100) for k, v in risk_factors.items()}
        diff = 100 - sum(normalized_factors.values())
        if diff != 0:
            normalized_factors["historical"] += diff
        risk_factors = normalized_factors
        
    # Tentukan Largest Driver
    largest_driver_key = max(risk_factors, key=risk_factors.get)
    driver_map = {
        "historical": "Tren Histori",
        "holiday": "Event / Libur",
        "rain": "Curah Hujan Tinggi",
        "weekend": "Aktivitas Akhir Pekan"
    }
    largest_driver = driver_map.get(largest_driver_key, "Tren Histori")
    
    # Confidence Level
    confidence_level = "High" if total_risk > 50 else ("Medium" if total_risk > 30 else "Low")
    if is_holiday or rainfall_mm > 25:
        confidence_level = "High"
        
    ai_insights = {
        "largest_driver": largest_driver,
        "rainfall_mm": float(rainfall_mm),
        "is_weekend": is_weekend,
        "is_holiday": is_holiday,
        "active_event": active_event.name if active_event else None,
        "risk_factors": risk_factors,
        "confidence_level": confidence_level
    }
    
    data.ai_insights = ai_insights
    
    return response_success(data=data, message="Zone retrieved successfully")

@router.post("/zones", status_code=status.HTTP_201_CREATED)
def create_zone(zone: ZoneCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Membuat wilayah TPS baru.
    """
    new_zone = Zone(**zone.model_dump())
    db.add(new_zone)
    db.commit()
    db.refresh(new_zone)
    data = ZoneResponse.model_validate(new_zone)
    return response_success(data=data, message="Zone created successfully")

@router.put("/zones/{zone_id}")
def update_zone(zone_id: int, zone: ZoneUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Memperbarui informasi wilayah TPS secara dinamis.
    """
    existing_zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not existing_zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    for key, value in zone.model_dump(exclude_unset=True).items():
        setattr(existing_zone, key, value)
    
    db.commit()
    db.refresh(existing_zone)
    data = ZoneResponse.model_validate(existing_zone)
    return response_success(data=data, message="Zone updated successfully")

@router.delete("/zones/{zone_id}")
def delete_zone(zone_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """
    Menghapus wilayah TPS berdasarkan ID.
    """
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    db.delete(zone)
    db.commit()
    return response_success(message="Zone deleted successfully")

@router.get("/zones/kecamatan/{kecamatan}", response_model=dict)
def get_zones_by_kecamatan(
    kecamatan: str,
    db: Session = Depends(get_db)
):
    """
    Mengambil seluruh daftar TPS berdasarkan nama kecamatan (Case-Insensitive).
    """
    clean_kecamatan = kecamatan.strip()
    if not clean_kecamatan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nama kecamatan tidak boleh kosong atau hanya berisi spasi."
        )

    zones = (
        db.query(Zone)
        .filter(func.lower(Zone.kecamatan) == func.lower(clean_kecamatan))
        .all()
    )

    if not zones:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"TPS di kecamatan '{clean_kecamatan}' tidak ditemukan."
        )

    return {
        "success": True,
        "message": "Zone retrieved successfully",
        "total_tps": len(zones),
        "data": [ZoneResponse.model_validate(z) for z in zones]
    }