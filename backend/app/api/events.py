from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
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


@router.post("/events/import")
def import_events(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Mengimpor daftar event dari file CSV ke database.
    Format kolom CSV: name, start_date (YYYY-MM-DD), end_date (YYYY-MM-DD), location, wilayah, kecamatan, urgency_score (0.0-1.0), description
    """
    import csv
    import io
    from datetime import datetime
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File yang diunggah harus berformat .csv"
        )
        
    try:
        content = file.file.read().decode("utf-8")
        csv_reader = csv.DictReader(io.StringIO(content))
        
        imported_events = []
        for row in csv_reader:
            name = row.get("name")
            start_date_str = row.get("start_date")
            end_date_str = row.get("end_date")
            
            if not name or not start_date_str or not end_date_str:
                continue
                
            try:
                start_date = datetime.strptime(start_date_str.strip(), "%Y-%m-%d").date()
                end_date = datetime.strptime(end_date_str.strip(), "%Y-%m-%d").date()
            except ValueError:
                try:
                    start_date = datetime.strptime(start_date_str.strip(), "%d-%m-%Y").date()
                    end_date = datetime.strptime(end_date_str.strip(), "%d-%m-%Y").date()
                except ValueError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Format tanggal pada baris '{name}' tidak valid. Gunakan format YYYY-MM-DD atau DD-MM-YYYY."
                    )
            
            try:
                urgency_score = float(row.get("urgency_score", 0.5))
            except ValueError:
                urgency_score = 0.5
            
            new_event = Event(
                name=name.strip(),
                start_date=start_date,
                end_date=end_date,
                location=row.get("location", "").strip() if row.get("location") else "",
                wilayah=row.get("wilayah", "").strip() if row.get("wilayah") else "",
                kecamatan=row.get("kecamatan", "").strip() if row.get("kecamatan") else "",
                urgency_score=urgency_score,
                description=row.get("description", "").strip() if row.get("description") else ""
            )
            imported_events.append(new_event)
            
        if not imported_events:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tidak ada data event valid yang diimpor dari file CSV."
            )
            
        db.add_all(imported_events)
        db.commit()
        
        return response_success(
            data={"imported_count": len(imported_events)},
            message=f"Berhasil mengimpor {len(imported_events)} event dari file CSV."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal memproses file CSV: {str(e)}"
        )
