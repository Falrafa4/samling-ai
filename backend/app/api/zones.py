from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.zones import Zone
from app.schemas.zones import ZoneCreate, ZoneUpdate

router = APIRouter()

@router.get("/zones")
def get_zones(db: Session = Depends(get_db)):
    zones = db.query(Zone).all()
    return {
        "message": "Zones retrieved successfully",
        "zones": zones
    }

@router.get("/zones/{zone_id}")
def get_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return {
        "message": "Zone retrieved successfully",
        "zone": zone
    }

@router.post("/zones")
def create_zone(zone: ZoneCreate, db: Session = Depends(get_db)):
    new_zone = Zone(**zone.model_dump())
    db.add(new_zone)
    db.commit()
    db.refresh(new_zone)
    return {
        "message": "Zone created successfully",
        "zone": new_zone
    }

@router.put("/zones/{zone_id}")
def update_zone(zone_id: int, zone: ZoneUpdate, db: Session = Depends(get_db)):
    existing_zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not existing_zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    for key, value in zone.model_dump(exclude_unset=True).items():
        setattr(existing_zone, key, value)
    
    db.commit()
    db.refresh(existing_zone)
    return {
        "message": "Zone updated successfully",
        "zone": existing_zone
    }

@router.delete("/zones/{zone_id}")
def delete_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    db.delete(zone)
    db.commit()
    return {
        "message": "Zone deleted successfully"
    }