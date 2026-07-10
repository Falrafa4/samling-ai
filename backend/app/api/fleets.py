from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.models.fleets import Fleet
from app.schemas.fleets import FleetCreate, FleetUpdate, FleetResponse
from app.api.deps import get_current_user
from app.utils.response import response_success

router = APIRouter(tags=["fleets"], dependencies=[Depends(get_current_user)])

@router.get("/fleets")
def get_all_fleets(db: Session = Depends(get_db)):
    """
    Mengambil semua daftar tipe armada kendaraan DLH Jakarta. (Memerlukan Autentikasi)
    """
    fleets = db.query(Fleet).order_by(Fleet.category.desc(), Fleet.name.asc()).all()
    data = [FleetResponse.model_validate(f) for f in fleets]
    return response_success(data=data, message="Daftar tipe armada berhasil diambil.")

@router.get("/fleets/{id}")
def get_fleet_by_id(id: int, db: Session = Depends(get_db)):
    """
    Mengambil informasi detail tipe armada berdasarkan ID. (Memerlukan Autentikasi)
    """
    fleet = db.query(Fleet).filter(Fleet.id == id).first()
    if not fleet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipe armada tidak ditemukan."
        )
    data = FleetResponse.model_validate(fleet)
    return response_success(data=data, message="Detail tipe armada berhasil diambil.")

@router.post("/fleets", status_code=status.HTTP_201_CREATED)
def create_fleet(fleet_data: FleetCreate, db: Session = Depends(get_db)):
    """
    Menambahkan tipe armada baru di sistem. (Memerlukan Autentikasi)
    """
    # Validasi nama unik
    existing = db.query(Fleet).filter(Fleet.name == fleet_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipe armada dengan nama '{fleet_data.name}' sudah terdaftar."
        )

    new_fleet = Fleet(
        name=fleet_data.name,
        category=fleet_data.category,
        type=fleet_data.type,
        capacity=fleet_data.capacity,
        total_units=fleet_data.total_units
    )
    db.add(new_fleet)
    db.commit()
    db.refresh(new_fleet)
    
    data = FleetResponse.model_validate(new_fleet)
    return response_success(data=data, message="Tipe armada baru berhasil terdaftar.")

@router.put("/fleets/{id}")
def update_fleet(id: int, fleet_data: FleetUpdate, db: Session = Depends(get_db)):
    """
    Memperbarui informasi tipe armada. (Memerlukan Autentikasi)
    """
    fleet = db.query(Fleet).filter(Fleet.id == id).first()
    if not fleet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipe armada tidak ditemukan."
        )

    # Validasi nama unik jika diganti
    if fleet_data.name is not None and fleet_data.name != fleet.name:
        existing = db.query(Fleet).filter(Fleet.name == fleet_data.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipe armada dengan nama '{fleet_data.name}' sudah digunakan."
            )

    for key, value in fleet_data.model_dump(exclude_unset=True).items():
        setattr(fleet, key, value)

    db.commit()
    db.refresh(fleet)
    
    data = FleetResponse.model_validate(fleet)
    return response_success(data=data, message="Informasi tipe armada berhasil diperbarui.")

@router.delete("/fleets/{id}")
def delete_fleet(id: int, db: Session = Depends(get_db)):
    """
    Menghapus tipe armada dari sistem. (Memerlukan Autentikasi)
    Supir yang terkait akan di-null-kan armada-nya secara otomatis.
    """
    fleet = db.query(Fleet).filter(Fleet.id == id).first()
    if not fleet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipe armada tidak ditemukan."
        )

    db.delete(fleet)
    db.commit()
    return response_success(message="Tipe armada berhasil dihapus dari sistem.")
