from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import math

from app.database.database import get_db
from app.models.events import Event
from app.schemas.events import EventCreate, EventUpdate, EventResponse
from app.utils.response import response_success

router = APIRouter(tags=["events"])

@router.get("/events")
def get_events(
    page: Optional[int] = Query(None, description="Nomor Halaman (1-indexed)"),
    per_page: Optional[int] = Query(None, description="Jumlah item per halaman"),
    search: Optional[str] = Query(None, description="Cari berdasarkan nama event"),
    db: Session = Depends(get_db)
):
    """
    Mengambil daftar event tahunan (Mendukung paginasi dan pencarian).
    """
    query = db.query(Event)
    
    if search:
        query = query.filter(Event.name.ilike(f"%{search}%"))
        
    query = query.order_by(Event.start_date.asc())

    if page is not None and per_page is not None:
        total = query.count()
        total_pages = math.ceil(total / per_page) if per_page > 0 else 0
        offset = (page - 1) * per_page
        events = query.offset(offset).limit(per_page).all()
        
        paginated_data = {
            "items": [EventResponse.model_validate(e) for e in events],
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages
        }
        return response_success(data=paginated_data, message="Daftar event berhasil diambil dengan paginasi.")
    else:
        events = query.all()
        data = [EventResponse.model_validate(e) for e in events]
        return response_success(data=data, message="Seluruh daftar event berhasil diambil.")

@router.get("/events/{event_id}")
def get_event(event_id: int, db: Session = Depends(get_db)):
    """
    Mengambil detail satu event berdasarkan ID.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event dengan ID {event_id} tidak ditemukan."
        )
    return response_success(data=EventResponse.model_validate(event), message="Detail event berhasil diambil.")

@router.post("/events", status_code=status.HTTP_201_CREATED)
def create_event(event_in: EventCreate, db: Session = Depends(get_db)):
    """
    Menambahkan event tahunan baru ke database.
    """
    new_event = Event(
        name=event_in.name,
        start_date=event_in.start_date,
        end_date=event_in.end_date,
        location=event_in.location,
        wilayah=event_in.wilayah,
        kecamatan=event_in.kecamatan,
        urgency_score=event_in.urgency_score,
        description=event_in.description
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    
    return response_success(data=EventResponse.model_validate(new_event), message="Event berhasil ditambahkan.")

@router.put("/events/{event_id}")
def update_event(event_id: int, event_in: EventUpdate, db: Session = Depends(get_db)):
    """
    Mengedit informasi event yang sudah terdaftar.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event dengan ID {event_id} tidak ditemukan."
        )
        
    update_data = event_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)
        
    db.commit()
    db.refresh(event)
    
    return response_success(data=EventResponse.model_validate(event), message="Event berhasil diperbarui.")

@router.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    """
    Menghapus event dari database.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event dengan ID {event_id} tidak ditemukan."
        )
        
    db.delete(event)
    db.commit()
    
    return response_success(message="Event berhasil dihapus.")
