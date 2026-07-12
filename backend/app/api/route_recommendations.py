from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
import json

from app.database.database import get_db
from app.models.route_recommendations import RouteRecommendation
from app.models.users import User
from app.models.zones import Zone
from app.schemas.route_recommendations import RouteRecommendationCreate, RouteRecommendationResponse, RouteStatusUpdate
from app.api.deps import get_current_user
from app.utils.response import response_success

router = APIRouter(tags=["route-recommendations"])

@router.post("/route-recommendations", status_code=status.HTTP_201_CREATED)
def create_route_recommendation(route_in: RouteRecommendationCreate, db: Session = Depends(get_db)):
    """
    Simpan Rekomendasi Rute Baru (Endpoint Publik untuk AI Engine).
    Menerima hanya route_json. driver_id selalu NULL (belum ditugaskan).
    Memvalidasi format route_json dan keabsahan zone_id.
    """
    # 1. Validasi format JSON dan tipe data array/list
    try:
        zone_ids = json.loads(route_in.route_json)
        if not isinstance(zone_ids, list):
            raise ValueError()
        # Harus list of integers
        if not all(isinstance(x, int) for x in zone_ids):
            raise ValueError()
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="route_json harus berupa format string JSON list dari ID zona (contoh: '[1, 3, 5]')."
        )

    # 2. Validasi keabsahan seluruh zone_id di database
    if zone_ids:
        existing_zones_count = db.query(Zone).filter(Zone.id.in_(zone_ids)).count()
        if existing_zones_count != len(set(zone_ids)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Satu atau lebih zone_id di dalam rute tidak valid atau tidak terdaftar di sistem."
            )

    # 3. Simpan rekomendasi rute baru dengan status default 'Pending', driver_id = NULL
    new_route = RouteRecommendation(
        driver_id=None,
        route_json=route_in.route_json,
        status="Pending"
    )
    db.add(new_route)
    db.commit()
    db.refresh(new_route)

    # Reload dengan driver ter-eager load untuk serialisasi relasi
    new_route_loaded = (
        db.query(RouteRecommendation)
        .options(joinedload(RouteRecommendation.driver))
        .filter(RouteRecommendation.id == new_route.id)
        .first()
    )

    data = RouteRecommendationResponse.model_validate(new_route_loaded)
    return response_success(data=data, message="Rekomendasi rute baru berhasil disimpan.")

@router.get("/route-recommendations/latest")
def get_latest_route_recommendation(db: Session = Depends(get_db)):
    """
    Mengambil Rute Optimal Terkini secara global (Endpoint Publik).
    """
    route = (
        db.query(RouteRecommendation)
        .options(joinedload(RouteRecommendation.driver))
        .order_by(RouteRecommendation.created_at.desc())
        .first()
    )
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rekomendasi rute belum dibuat."
        )

    data = RouteRecommendationResponse.model_validate(route)
    return response_success(data=data, message="Rekomendasi rute terbaru berhasil diambil.")

@router.post("/route-recommendations/dispatch/{driver_id}")
def dispatch_route_recommendation(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tugaskan Rute ke Driver (Memerlukan Autentikasi).
    Mengambil rute Pending terbaru yang belum ditugaskan (driver_id IS NULL),
    mengaitkan ke driver, dan memperbarui status rute menjadi 'In Progress'.
    """
    # 1. Validasi driver terdaftar di sistem
    driver = db.query(User).filter(User.id == driver_id, User.role == "driver").first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver tidak ditemukan."
        )

    # 2. Ambil rute optimal terbaru khusus driver ini, atau cari rute Pending yang belum ditugaskan
    latest_route = (
        db.query(RouteRecommendation)
        .filter(RouteRecommendation.driver_id == driver_id)
        .order_by(RouteRecommendation.created_at.desc())
        .first()
    )
    if not latest_route:
        # Cari rute Pending terbaru yang belum ditugaskan (driver_id IS NULL)
        latest_route = (
            db.query(RouteRecommendation)
            .filter(RouteRecommendation.driver_id == None, RouteRecommendation.status == "Pending")
            .order_by(RouteRecommendation.created_at.desc())
            .first()
        )
        if latest_route:
            # Kaitkan rute ke driver ini
            latest_route.driver_id = driver_id
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tidak ada rekomendasi rute optimal yang tersedia untuk ditugaskan ke driver {driver.name}."
            )

    # 3. Ekstrak dan urutkan wilayah tugas
    zone_ids = json.loads(latest_route.route_json)
    if not zone_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rekomendasi rute kosong (tidak ada wilayah TPS)."
        )

    # Query seluruh zone yang masuk dalam rute
    zones = db.query(Zone).filter(Zone.id.in_(zone_ids)).all()
    zone_map = {z.id: z for z in zones}
    ordered_zones = [zone_map[zid] for zid in zone_ids if zid in zone_map]

    # 4. Perbarui status rute dan status ketersediaan driver di database
    latest_route.status = "In Progress"
    driver.status = "On Duty"
    db.commit()
    db.refresh(latest_route)
    db.refresh(driver)

    dispatch_data = {
        "driver_id": driver.id,
        "driver_name": driver.name,
        "route_status": latest_route.status,
        "driver_status": driver.status
    }

    return response_success(
        data=dispatch_data,
        message=f"Rute rekomendasi berhasil ditugaskan ke Driver {driver.name} secara digital."
    )

@router.get("/route-recommendations/driver/{driver_id}")
def get_driver_route_recommendations(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mengambil rute rekomendasi milik supir tertentu (Memerlukan Autentikasi).
    Hanya rute dengan status 'Pending' atau 'In Progress'.
    """
    # 1. Validasi driver terdaftar sebagai supir
    driver = db.query(User).filter(User.id == driver_id, User.role == "driver").first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver tidak ditemukan."
        )

    # 2. Query rute Pending/In Progress
    routes = (
        db.query(RouteRecommendation)
        .options(joinedload(RouteRecommendation.driver))
        .filter(
            RouteRecommendation.driver_id == driver_id,
            RouteRecommendation.status.in_(["Pending", "In Progress"])
        )
        .order_by(RouteRecommendation.created_at.desc())
        .all()
    )

    data = [RouteRecommendationResponse.model_validate(r) for r in routes]
    return response_success(data=data, message="Daftar rute driver berhasil diambil.")

@router.put("/route-recommendations/{id}/status")
def update_route_status(
    id: int,
    status_in: RouteStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Memperbarui status rute rekomendasi (Memerlukan Autentikasi).
    Menerima status baru (Pending, In Progress, Completed).
    """
    route = db.query(RouteRecommendation).filter(RouteRecommendation.id == id).first()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rekomendasi rute tidak ditemukan."
        )

    allowed_statuses = ["Pending", "In Progress", "Completed"]
    if status_in.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Status tidak valid. Harus salah satu dari: {', '.join(allowed_statuses)}"
        )

    # Update status rute
    route.status = status_in.status

    # Jika diselesaikan, kembalikan ketersediaan driver menjadi 'Available'
    if status_in.status == "Completed":
        driver = db.query(User).filter(User.id == route.driver_id).first()
        if driver:
            driver.status = "Available"

    db.commit()
    
    # Reload dengan driver ter-eager load
    route_loaded = (
        db.query(RouteRecommendation)
        .options(joinedload(RouteRecommendation.driver))
        .filter(RouteRecommendation.id == id)
        .first()
    )

    data = RouteRecommendationResponse.model_validate(route_loaded)
    return response_success(data=data, message="Status rute berhasil diperbarui.")