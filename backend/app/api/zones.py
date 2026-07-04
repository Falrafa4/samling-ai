from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.zones import Zone
from app.schemas.zones import ZoneCreate, ZoneUpdate, ZoneResponse
from app.utils.response import response_success

router = APIRouter()

@router.get("/zones")
def get_zones(db: Session = Depends(get_db)):
    """
    Mengambil seluruh daftar wilayah TPS.
    """
    zones = db.query(Zone).all()
    data = [ZoneResponse.model_validate(z) for z in zones]
    return response_success(data=data, message="Zones retrieved successfully")

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
def create_zone(zone: ZoneCreate, db: Session = Depends(get_db)):
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
def update_zone(zone_id: int, zone: ZoneUpdate, db: Session = Depends(get_db)):
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
def delete_zone(zone_id: int, db: Session = Depends(get_db)):
    """
    Menghapus wilayah TPS berdasarkan ID.
    """
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    db.delete(zone)
    db.commit()
    return response_success(message="Zone deleted successfully")