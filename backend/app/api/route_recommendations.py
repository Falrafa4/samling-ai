from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
import json

from app.database.database import get_db
from app.models.route_recommendations import RouteRecommendation
from app.models.users import User
from app.models.zones import Zone
from app.schemas.route_recommendations import (
    RouteRecommendationCreate,
    RouteRecommendationResponse,
    RouteStatusUpdate,
)
from app.api.deps import get_current_user
from app.utils.response import response_success
from app.ai.scheduler.feature_engineer import collect_daily_data
from app.ai.scheduler.forecast_scheduler import forecast_all_tps
from app.ai.scheduler.route_scheduler import generate_routes

router = APIRouter(tags=["route-recommendations"])

def run_full_pipeline():
    print("[Manual Trigger] Starting full AI Pipeline (Collect data -> Forecast -> Route VRP)...")
    errors = []

    try:
        collect_daily_data()
    except Exception as e:
        print(f"[Manual Trigger] Error in collect_daily_data: {e}")
        errors.append(f"Data collection: {e}")

    try:
        forecast_all_tps()
    except Exception as e:
        print(f"[Manual Trigger] Error in forecast_all_tps: {e}")
        errors.append(f"Forecast: {e}")

    try:
        generate_routes()
    except Exception as e:
        print(f"[Manual Trigger] Error in generate_routes: {e}")
        errors.append(f"Route generation: {e}")

    if errors:
        print(f"[Manual Trigger] Pipeline completed with {len(errors)} error(s): {'; '.join(errors)}")
    else:
        print("[Manual Trigger] Full AI Pipeline completed successfully.")


def _load_with_driver(db: Session, rec_id: int) -> RouteRecommendation:
    return (
        db.query(RouteRecommendation)
        .options(joinedload(RouteRecommendation.driver))
        .filter(RouteRecommendation.id == rec_id)
        .first()
    )


@router.post("/route-recommendations", status_code=status.HTTP_201_CREATED)
def create_route_recommendation(
    route_in: RouteRecommendationCreate,
    db: Session = Depends(get_db),
):
    """
    Simpan Rekomendasi Rute Baru (Endpoint Publik untuk AI Engine).
    Dipanggil sekali per coverage_area setelah VRP selesai.
    """
    # 1. Validasi route_json adalah list of dicts
    try:
        stops = json.loads(route_in.route_json)
        if not isinstance(stops, list):
            raise ValueError()
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="route_json harus berupa JSON string dari list stop.",
        )

    # 2. Validasi driver_id (jika diberikan)
    if route_in.driver_id is not None:
        driver = db.query(User).filter(
            User.id == route_in.driver_id,
            User.role == "driver",
        ).first()
        if not driver:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Driver ID {route_in.driver_id} tidak ditemukan.",
            )

    # 3. Simpan rekomendasi rute baru dengan status default 'Pending', driver_id = NULL
    new_route = RouteRecommendation(
        forecast_batch_id=route_in.forecast_batch_id,
        coverage_area=route_in.coverage_area,
        driver_id=route_in.driver_id,
        total_stops=route_in.total_stops,
        route_json=route_in.route_json,
        status="Pending",
    )
    db.add(new_route)
    db.commit()
    db.refresh(new_route)

    loaded = _load_with_driver(db, new_route.id)
    data = RouteRecommendationResponse.model_validate(loaded)
    return response_success(data=data, message="Rekomendasi rute baru berhasil disimpan.")


@router.post("/route-recommendations/trigger", status_code=status.HTTP_202_ACCEPTED)
def trigger_route_generation(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Jalankan seluruh pipeline prediksi & rekomendasi rute secara langsung (Admin only).
    Dijalankan di background sehingga request langsung kembali.
    """

    background_tasks.add_task(run_full_pipeline)
    return response_success(
        data=None,
        message="Pipeline prediksi volume & optimasi rute AI telah dimulai di background.",
    )

@router.get("/route-recommendations/latest")
def get_latest_route_recommendations(db: Session = Depends(get_db)):
    """
    Ambil semua rute dari batch terbaru (semua coverage_area).
    """
    latest_batch = (
        db.query(RouteRecommendation.forecast_batch_id)
        .order_by(RouteRecommendation.created_at.desc())
        .first()
    )

    if not latest_batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Belum ada rekomendasi rute.",
        )

    batch_id = latest_batch[0]

    routes = (
        db.query(RouteRecommendation)
        .options(joinedload(RouteRecommendation.driver))
        .filter(RouteRecommendation.forecast_batch_id == batch_id)
        .order_by(RouteRecommendation.coverage_area)
        .all()
    )

    data = [RouteRecommendationResponse.model_validate(r) for r in routes]
    return response_success(data=data, message=f"Rute terbaru dari batch {batch_id} berhasil diambil.")


# ─────────────────────────────────────────────
# GET /route-recommendations/driver/{driver_id}
# ─────────────────────────────────────────────

@router.get("/route-recommendations/driver/{driver_id}")
def get_driver_route_recommendations(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ambil rute milik driver tertentu (Pending / In Progress).
    """
    driver = db.query(User).filter(
        User.id == driver_id, User.role == "driver"
    ).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver tidak ditemukan.",
        )

    routes = (
        db.query(RouteRecommendation)
        .options(joinedload(RouteRecommendation.driver))
        .filter(
            RouteRecommendation.driver_id == driver_id,
            RouteRecommendation.status.in_(["Pending", "In Progress"]),
        )
        .order_by(RouteRecommendation.created_at.desc())
        .all()
    )

    data = [RouteRecommendationResponse.model_validate(r) for r in routes]
    return response_success(data=data, message="Daftar rute driver berhasil diambil.")

@router.post("/route-recommendations/dispatch/{driver_id}")
def dispatch_route_recommendation(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Tugaskan rute Pending terbaru ke driver, ubah status menjadi 'In Progress'.
    """
    driver = db.query(User).filter(
        User.id == driver_id, User.role == "driver"
    ).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver tidak ditemukan.",
        )

    # Ambil rute pending terbaru milik driver atau yang belum ditugaskan
    route = (
        db.query(RouteRecommendation)
        .filter(
            RouteRecommendation.driver_id == driver_id,
            RouteRecommendation.status == "Pending",
        )
        .order_by(RouteRecommendation.created_at.desc())
        .first()
    )

    if not route:
        # Cari rute Pending yang belum ditugaskan dengan coverage_area yang cocok
        route = (
            db.query(RouteRecommendation)
            .filter(
                RouteRecommendation.driver_id == None,
                RouteRecommendation.status == "Pending",
                RouteRecommendation.coverage_area == driver.coverage_area,
            )
            .order_by(RouteRecommendation.created_at.desc())
            .first()
        )
        if route:
            route.driver_id = driver_id
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tidak ada rute Pending tersedia untuk driver {driver.name}.",
            )

    route.status = "In Progress"
    driver.status = "On Duty"
    db.commit()

    dispatch_data = {
        "driver_id": driver.id,
        "driver_name": driver.name,
        "coverage_area": route.coverage_area,
        "route_status": route.status,
        "driver_status": driver.status,
        "total_stops": route.total_stops,
    }
    return response_success(
        data=dispatch_data,
        message=f"Rute berhasil ditugaskan ke Driver {driver.name}.",
    )


@router.put("/route-recommendations/{id}/status")
def update_route_status(
    id: int,
    status_in: RouteStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Perbarui status rute rekomendasi.
    """
    route = db.query(RouteRecommendation).filter(RouteRecommendation.id == id).first()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rekomendasi rute tidak ditemukan.",
        )

    allowed = ["Pending", "In Progress", "Completed"]
    if status_in.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Status tidak valid. Pilihan: {', '.join(allowed)}",
        )

    route.status = status_in.status

    if status_in.status == "Completed":
        driver = db.query(User).filter(User.id == route.driver_id).first()
        if driver:
            driver.status = "Available"
    elif status_in.status == "In Progress":
        driver = db.query(User).filter(User.id == route.driver_id).first()
        if driver:
            driver.status = "On Duty"

    db.commit()

    loaded = _load_with_driver(db, id)
    data = RouteRecommendationResponse.model_validate(loaded)
    return response_success(data=data, message="Status rute berhasil diperbarui.")


@router.get("/route-recommendations")
def list_route_recommendations(
    coverage_area: str | None = None,
    forecast_batch_id: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    """
    List semua rekomendasi rute (opsional filter by area / batch / status).
    """
    query = db.query(RouteRecommendation).options(
        joinedload(RouteRecommendation.driver)
    )

    if coverage_area:
        query = query.filter(RouteRecommendation.coverage_area == coverage_area)
    if forecast_batch_id:
        query = query.filter(RouteRecommendation.forecast_batch_id == forecast_batch_id)
    if status:
        query = query.filter(RouteRecommendation.status == status)

    routes = query.order_by(RouteRecommendation.created_at.desc()).all()

    data = [RouteRecommendationResponse.model_validate(r) for r in routes]
    return response_success(data=data, message="Daftar rekomendasi rute berhasil diambil.")