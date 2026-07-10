from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.models.users import User
from app.models.zones import Zone
from app.models.fleets import Fleet
from app.schemas.drivers import DriverCreate, DriverUpdate, DriverResponse
from app.api.deps import get_current_user
from app.utils.response import response_success
from app.utils.security import get_password_hash

router = APIRouter(tags=["drivers"], dependencies=[Depends(get_current_user)])

@router.get("/drivers")
def get_drivers(db: Session = Depends(get_db)):
    """
    Mengambil seluruh daftar supir armada (User dengan role='driver'). (Memerlukan Autentikasi)
    """
    drivers = db.query(User).filter(User.role == "driver").all()
    data = [DriverResponse.model_validate(d) for d in drivers]
    return response_success(data=data, message="Daftar driver berhasil diambil.")

@router.get("/drivers/{id}")
def get_driver(id: int, db: Session = Depends(get_db)):
    """
    Mengambil informasi detail supir berdasarkan ID. (Memerlukan Autentikasi)
    """
    driver = db.query(User).filter(User.id == id, User.role == "driver").first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver tidak ditemukan."
        )
    data = DriverResponse.model_validate(driver)
    return response_success(data=data, message="Detail driver berhasil diambil.")

@router.post("/drivers", status_code=status.HTTP_201_CREATED)
def create_driver(driver_data: DriverCreate, db: Session = Depends(get_db)):
    """
    Mendaftarkan supir armada baru (membuat User baru dengan role='driver'). (Memerlukan Autentikasi)
    """
    # 1.1 Validasi fleet_id jika dikirim
    if driver_data.fleet_id is not None:
        fleet = db.query(Fleet).filter(Fleet.id == driver_data.fleet_id).first()
        if not fleet:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Armada dengan ID {driver_data.fleet_id} tidak terdaftar di sistem."
            )
    
    # 2. Validasi nomor WA sudah dipakai driver/user lain
    existing_phone = db.query(User).filter(User.whatsapp_number == driver_data.whatsapp_number).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nomor WhatsApp tersebut sudah terdaftar untuk pengguna/driver lain."
        )

    # 3. Tentukan password default jika tidak dikirim
    username = driver_data.username
    password = driver_data.password or "driver123"

    # Validasi username unik
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{username}' sudah terdaftar di sistem."
        )

    new_driver = User(
        name=driver_data.name,
        username=username,
        password=get_password_hash(password),
        role="driver",
        whatsapp_number=driver_data.whatsapp_number,
        fleet_id=driver_data.fleet_id,
        status="Offline"
    )
    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)
    
    data = DriverResponse.model_validate(new_driver)
    return response_success(data=data, message="Driver baru berhasil didaftarkan.")

@router.put("/drivers/{id}")
def update_driver(id: int, driver_data: DriverUpdate, db: Session = Depends(get_db)):
    """
    Memperbarui informasi supir secara dinamis. (Memerlukan Autentikasi)
    """
    driver = db.query(User).filter(User.id == id, User.role == "driver").first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver tidak ditemukan."
        )

    # 1.1 Validasi fleet_id jika di-update
    if driver_data.fleet_id is not None:
        fleet = db.query(Fleet).filter(Fleet.id == driver_data.fleet_id).first()
        if not fleet:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Armada dengan ID {driver_data.fleet_id} tidak terdaftar di sistem."
            )

    # 2. Validasi whatsapp_number jika di-update
    if driver_data.whatsapp_number is not None:
        existing_phone = db.query(User).filter(
            User.whatsapp_number == driver_data.whatsapp_number,
            User.id != id
        ).first()
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nomor WhatsApp tersebut sudah terdaftar untuk pengguna/driver lain."
            )

    # 3. Validasi username jika di-update
    if driver_data.username is not None:
        existing_user = db.query(User).filter(
            User.username == driver_data.username,
            User.id != id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username '{driver_data.username}' sudah terdaftar."
            )

    # 4. Update fields
    for key, value in driver_data.model_dump(exclude_unset=True).items():
        if key == "password":
            setattr(driver, "password", get_password_hash(value))
        else:
            setattr(driver, key, value)

    db.commit()
    db.refresh(driver)
    
    data = DriverResponse.model_validate(driver)
    return response_success(data=data, message="Data driver berhasil diperbarui.")

@router.delete("/drivers/{id}")
def delete_driver(id: int, db: Session = Depends(get_db)):
    """
    Menghapus driver berdasarkan ID. (Memerlukan Autentikasi)
    """
    driver = db.query(User).filter(User.id == id, User.role == "driver").first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver tidak ditemukan."
        )

    db.delete(driver)
    db.commit()
    return response_success(message="Driver berhasil dihapus.")
