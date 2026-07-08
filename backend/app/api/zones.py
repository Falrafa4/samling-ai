from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
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
def get_zones_filter_options(db: Session = Depends(get_db)):
    """
    Mengambil daftar opsi wilayah, kecamatan, kelurahan, dan jenis TPS yang unik langsung dari database.
    """
    wilayahs = [r[0] for r in db.query(Zone.wilayah).distinct().filter(Zone.wilayah != None).all()]
    kecamatans = [r[0] for r in db.query(Zone.kecamatan).distinct().filter(Zone.kecamatan != None).all()]
    kelurahans = [r[0] for r in db.query(Zone.kelurahan).distinct().filter(Zone.kelurahan != None).all()]
    jenis_tps_list = [r[0] for r in db.query(Zone.jenis_tps).distinct().filter(Zone.jenis_tps != None).all()]
    
    data = {
        "wilayah": sorted(wilayahs),
        "kecamatan": sorted(kecamatans),
        "kelurahan": sorted(kelurahans),
        "jenis_tps": sorted(jenis_tps_list)
    }
    return response_success(data=data, message="Zones filter options retrieved successfully")

@router.get("/zones/{zone_id}")
def get_zone(zone_id: int, db: Session = Depends(get_db)):
    """
    Mengambil detail wilayah TPS berdasarkan ID.
    """
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    data = ZoneResponse.model_validate(zone)
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