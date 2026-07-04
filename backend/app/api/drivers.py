from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.database import get_db
from app.models.drivers import Driver
from app.models.zones import Zone
from app.schemas.drivers import DriverCreate, DriverUpdate, DriverResponse
from app.api.deps import get_current_user

router = APIRouter(tags=["drivers"], dependencies=[Depends(get_current_user)])

@router.get("/drivers", response_model=List[DriverResponse])
def get_drivers(db: Session = Depends(get_db)):
    """
    Mengambil seluruh daftar supir armada. (Memerlukan Autentikasi)
    """
    return db.query(Driver).all()

@router.get("/drivers/{id}", response_model=DriverResponse)
def get_driver(id: int, db: Session = Depends(get_db)):
    """
    Mengambil informasi detail supir berdasarkan ID. (Memerlukan Autentikasi)
    """
    driver = db.query(Driver).filter(Driver.id == id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver tidak ditemukan."
        )
    return driver

@router.post("/drivers", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
def create_driver(driver_data: DriverCreate, db: Session = Depends(get_db)):
    """
    Mendaftarkan supir armada baru. Validasi zone_id wajib ada di sistem. (Memerlukan Autentikasi)
    """
    # 1. Validasi zone_id ada di database
    zone = db.query(Zone).filter(Zone.id == driver_data.zone_id).first()
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Zone dengan ID {driver_data.zone_id} tidak terdaftar di sistem."
        )
    
    # 2. Validasi nomor WA sudah dipakai driver lain (mencegah data konflik)
    existing_phone = db.query(Driver).filter(Driver.whatsapp_number == driver_data.whatsapp_number).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nomor WhatsApp tersebut sudah terdaftar untuk driver lain."
        )

    new_driver = Driver(
        name=driver_data.name,
        whatsapp_number=driver_data.whatsapp_number,
        zone_id=driver_data.zone_id
    )
    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)
    return new_driver

@router.put("/drivers/{id}", response_model=DriverResponse)
def update_driver(id: int, driver_data: DriverUpdate, db: Session = Depends(get_db)):
    """
    Memperbarui informasi supir secara dinamis. (Memerlukan Autentikasi)
    """
    driver = db.query(Driver).filter(Driver.id == id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver tidak ditemukan."
        )

    # Validasi zone_id jika di-update
    if driver_data.zone_id is not None:
        zone = db.query(Zone).filter(Zone.id == driver_data.zone_id).first()
        if not zone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Zone dengan ID {driver_data.zone_id} tidak terdaftar di sistem."
            )

    # Validasi whatsapp_number jika di-update agar tidak duplikat dengan driver lain
    if driver_data.whatsapp_number is not None:
        existing_phone = db.query(Driver).filter(
            Driver.whatsapp_number == driver_data.whatsapp_number,
            Driver.id != id
        ).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nomor WhatsApp tersebut sudah terdaftar untuk driver lain."
            )

    # Update field yang dikirim saja (exclude_unset=True)
    for key, value in driver_data.model_dump(exclude_unset=True).items():
        setattr(driver, key, value)

    db.commit()
    db.refresh(driver)
    return driver

@router.delete("/drivers/{id}")
def delete_driver(id: int, db: Session = Depends(get_db)):
    """
    Menghapus driver berdasarkan ID. (Memerlukan Autentikasi)
    """
    driver = db.query(Driver).filter(Driver.id == id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver tidak ditemukan."
        )

    db.delete(driver)
    db.commit()
    return {"message": "Driver berhasil dihapus"}
