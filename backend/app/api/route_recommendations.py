from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
import json

from app.database.database import get_db
from app.models.route_recommendations import RouteRecommendation
from app.models.users import User
from app.models.zones import Zone
from app.schemas.route_recommendations import RouteRecommendationCreate, RouteRecommendationResponse
from app.api.deps import get_current_user
from app.utils.response import response_success

router = APIRouter(tags=["route-recommendations"], dependencies=[Depends(get_current_user)])

@router.post("/route-recommendations", status_code=status.HTTP_201_CREATED)
def create_route_recommendation(route_in: RouteRecommendationCreate, db: Session = Depends(get_db)):
    """
    Simpan Rekomendasi Rute Baru (Memerlukan Autentikasi).
    Memvalidasi format route_json, keabsahan driver_id, dan keabsahan zone_id.
    """
    # 1. Validasi driver_id terdaftar sebagai supir
    driver = db.query(User).filter(User.id == route_in.driver_id, User.role == "driver").first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver dengan ID {route_in.driver_id} tidak terdaftar di sistem."
        )

    # 2. Validasi format JSON dan tipe data array/list
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

    # 3. Validasi keabsahan seluruh zone_id di database
    if zone_ids:
        existing_zones_count = db.query(Zone).filter(Zone.id.in_(zone_ids)).count()
        if existing_zones_count != len(set(zone_ids)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Satu atau lebih zone_id di dalam rute tidak valid atau tidak terdaftar di sistem."
            )

    # 4. Simpan rekomendasi rute baru dengan status default 'Pending'
    new_route = RouteRecommendation(
        driver_id=route_in.driver_id,
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
    Mengambil Rute Optimal Terkini secara global (Memerlukan Autentikasi).
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
def dispatch_route_recommendation(driver_id: int, db: Session = Depends(get_db)):
    """
    Kirim Manifes Tugas ke Driver via WA (Memerlukan Autentikasi).
    Mengambil rute terbaru untuk driver ini, merelasikan dengan koordinat wilayah tugas, menyusun manifes terurut,
    menyimulasikan pengiriman navigasi, dan memperbarui status rute menjadi 'In Progress'.
    """
    # 1. Validasi driver terdaftar di sistem
    driver = db.query(User).filter(User.id == driver_id, User.role == "driver").first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver tidak ditemukan."
        )

    # 2. Ambil rute optimal terbaru khusus driver ini
    latest_route = (
        db.query(RouteRecommendation)
        .filter(RouteRecommendation.driver_id == driver_id)
        .order_by(RouteRecommendation.created_at.desc())
        .first()
    )
    if not latest_route:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Belum ada rekomendasi rute optimal yang ditugaskan ke driver {driver.name}."
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

    # 4. Susun pesan manifes WhatsApp
    tps_lines = []
    coords_list = []
    for idx, z in enumerate(ordered_zones, start=1):
        tps_lines.append(f"{idx}. {z.name} (Status: {z.risk_status})")
        coords_list.append(f"{z.latitude},{z.longitude}")

    # Membuat URL arah/navigasi multi-stop Google Maps
    gmaps_direction_url = f"https://www.google.com/maps/dir/{'/'.join(coords_list)}"

    message_body = (
        f"Halo *{driver.name}*,\n\n"
        f"Berikut adalah manifes rute tugas pengangkutan sampah optimal Anda hari ini:\n\n"
        f"📍 *Daftar Rute TPS Terurut*:\n"
        f"{chr(10).join(tps_lines)}\n\n"
        f"🗺️ *Navigasi Google Maps*:\n"
        f"{gmaps_direction_url}\n\n"
        f"Tetap utamakan keselamatan dalam berkendara! 🚚💨"
    )

    # 5. Simulasikan pengiriman ke gerbang WA Gateway
    print(f"\n📲 [WA GATEWAY SIMULATION] Mengirim pesan ke {driver.whatsapp_number}...")
    print("=========================================================================")
    print(message_body)
    print("=========================================================================\n")

    # 6. Perbarui status rute dan status ketersediaan driver
    latest_route.status = "In Progress"
    driver.status = "On Duty"
    db.commit()
    db.refresh(latest_route)
    db.refresh(driver)

    dispatch_data = {
        "driver_id": driver.id,
        "driver_name": driver.name,
        "whatsapp_number": driver.whatsapp_number,
        "message_body": message_body,
        "gmaps_url": gmaps_direction_url,
        "route_status": latest_route.status,
        "driver_status": driver.status
    }

    return response_success(
        data=dispatch_data,
        message=f"Manifes rute berhasil dikirim ke WhatsApp Supir {driver.name}."
    )
