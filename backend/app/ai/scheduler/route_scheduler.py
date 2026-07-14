import json
import os
import re
import requests

from math import radians, sin, cos, sqrt, atan2
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.volume_predictions import VolumePrediction
from app.models.zones import Zone
from app.models.users import User
from app.models.fleets import Fleet
from app.models.route_recommendations import RouteRecommendation

from ortools.constraint_solver import pywrapcp, routing_enums_pb2

DEPOTS_PATH = os.path.join(
    os.path.dirname(__file__),
    "../../core/depots.json"
)

AREA_MAPPING = {
    "Cakung": "Jakarta Timur",
    "Ciracas": "Jakarta Timur",
    "Cipayung": "Jakarta Timur",
    "Duren Sawit": "Jakarta Timur",
    "Jatinegara": "Jakarta Timur",
    "Kramat Jati": "Jakarta Timur",
    "Makasar": "Jakarta Timur",
    "Matraman": "Jakarta Timur",
    "Pasar Rebo": "Jakarta Timur",
    "Pulogadung": "Jakarta Timur",

    "Cengkareng": "Jakarta Barat",
    "Grogol Petamburan": "Jakarta Barat",
    "Kalideres": "Jakarta Barat",
    "Kebon Jeruk": "Jakarta Barat",
    "Kembangan": "Jakarta Barat",
    "Palmerah": "Jakarta Barat",
    "Tambora": "Jakarta Barat",
    "Taman Sari": "Jakarta Barat",

    "Cilandak": "Jakarta Selatan",
    "Jagakarsa": "Jakarta Selatan",
    "Kebayoran Baru": "Jakarta Selatan",
    "Kebayoran Lama": "Jakarta Selatan",
    "Mampang Prapatan": "Jakarta Selatan",
    "Pancoran": "Jakarta Selatan",
    "Pasar Minggu": "Jakarta Selatan",
    "Pesanggrahan": "Jakarta Selatan",
    "Setiabudi": "Jakarta Selatan",
    "Tebet": "Jakarta Selatan",

    "Cempaka Putih": "Jakarta Pusat",
    "Gambir": "Jakarta Pusat",
    "Johar Baru": "Jakarta Pusat",
    "Kemayoran": "Jakarta Pusat",
    "Menteng": "Jakarta Pusat",
    "Sawah Besar": "Jakarta Pusat",
    "Senen": "Jakarta Pusat",
    "Tanah Abang": "Jakarta Pusat",

    "Cilincing": "Jakarta Utara",
    "Kelapa Gading": "Jakarta Utara",
    "Koja": "Jakarta Utara",
    "Pademangan": "Jakarta Utara",
    "Penjaringan": "Jakarta Utara",
    "Tanjung Priok": "Jakarta Utara",

    "Kepulauan Seribu Selatan": "Kepulauan Seribu",
    "Kepulauan Seribu Utara": "Kepulauan Seribu",
}

def load_depots() -> dict:
    path = os.path.normpath(DEPOTS_PATH)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def fetch_latest_forecast(db: Session) -> tuple[list[dict], str] | None:
    latest_batch = (
        db.query(VolumePrediction.forecast_batch_id)
        .order_by(VolumePrediction.created_at.desc())
        .limit(1)
        .scalar()
    )

    if not latest_batch:
        print("No forecast batch found.")
        return None

    predictions = (
        db.query(VolumePrediction)
        .filter(
            VolumePrediction.forecast_batch_id == latest_batch,
            VolumePrediction.prediction_status != "NORMAL",
        )
        .order_by(VolumePrediction.priority_rank)
        .all()
    )

    if not predictions:
        print(f"No CRITICAL/WARNING predictions in batch {latest_batch}.")
        return None

    tps_ids = [p.tps_id for p in predictions]
    zones = db.query(Zone).filter(Zone.id.in_(tps_ids)).all()
    zone_map = {z.id: z for z in zones}

    rows = []
    for p in predictions:
        zone = zone_map.get(p.tps_id)
        if zone is None:
            print(f"Zone not found for tps_id={p.tps_id}, skipping.")
            continue

        kecamatan = p.kecamatan
        coverage_area = AREA_MAPPING.get(kecamatan)

        rows.append({
            "forecast_batch_id": p.forecast_batch_id,
            "tps_id": p.tps_id,
            "kecamatan": kecamatan,
            "predicted_volume_percentage": p.predicted_volume_percentage,
            "priority_rank": p.priority_rank,
            "prediction_status": p.prediction_status,
            "latitude": zone.latitude,
            "longitude": zone.longitude,
            "coverage_area": coverage_area,
        })

    return rows, latest_batch


def fetch_drivers(db: Session) -> list[dict]:
    drivers = (
        db.query(User)
        .filter(User.role == "driver")
        .all()
    )

    result = []
    for d in drivers:
        fleet = d.fleet
        capacity_kg = None
        if fleet and fleet.capacity:
            match = re.search(r"(\d+)", fleet.capacity)
            if match:
                capacity_kg = int(match.group(1)) * 1000

        result.append({
            "id": d.id,
            "name": d.name,
            "coverage_area": d.coverage_area,
            "fleet_id": fleet.id if fleet else None,
            "fleet_name": fleet.name if fleet else None,
            "fleet_type": fleet.type if fleet else None,
            "fleet_capacity": fleet.capacity if fleet else None,
            "truck_capacity_kg": capacity_kg,
        })

    return result


def build_distance_matrix(points: list[tuple[float, float]]) -> list[list[float]]:
    coordinates = ";".join(f"{lon},{lat}" for lat, lon in points)
    url = (
        f"http://router.project-osrm.org/table/v1/driving/{coordinates}"
        "?annotations=distance"
    )

    try:
        response = requests.get(url, timeout=15).json()
        return response["distances"]
    except Exception as e:
        print(f"OSRM table failed ({e}), falling back to haversine.")
        return _haversine_matrix(points)


def _haversine_matrix(points: list[tuple[float, float]]) -> list[list[float]]:
    """Haversine distance matrix (metres) as fallback."""
    R = 6_371_000
    n = len(points)
    matrix = [[0.0] * n for _ in range(n)]

    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            lat1, lon1 = map(radians, points[i])
            lat2, lon2 = map(radians, points[j])
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
            matrix[i][j] = R * 2 * atan2(sqrt(a), sqrt(1 - a))

    return matrix


def solve_vrp(distance_matrix: list[list[float]]) -> list[int] | None:
    """
    Solve TSP/VRP with OR-Tools (PATH_CHEAPEST_ARC).
    Returns ordered node indices, depot (0) at start and end.
    """
    n = len(distance_matrix)

    manager = pywrapcp.RoutingIndexManager(n, 1, 0)
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_idx, to_idx):
        return int(distance_matrix[manager.IndexToNode(from_idx)][manager.IndexToNode(to_idx)])

    transit_cb = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_cb)

    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )

    solution = routing.SolveWithParameters(params)
    if solution is None:
        return None

    order = []
    index = routing.Start(0)
    while not routing.IsEnd(index):
        order.append(manager.IndexToNode(index))
        index = solution.Value(routing.NextVar(index))
    order.append(0)  # return to depot

    return order

def build_area_route(
    area: str,
    tps_rows: list[dict],
    driver: dict,
    depots: dict,
) -> list[dict]:
    """
    Build the ordered stop list for one coverage area using VRP.
    Returns a list of stop dicts (Depot | TPS) matching the notebook format.
    """
    depot = depots.get(area)
    if not depot:
        print(f"No depot config for area '{area}', skipping.")
        return []

    # Point list: [depot] + [tps...]
    points = [(depot["latitude"], depot["longitude"])]
    points += [(row["latitude"], row["longitude"]) for row in tps_rows]

    # Build distance matrix
    distance_matrix = build_distance_matrix(points)

    # Solve VRP
    order = solve_vrp(distance_matrix)
    if order is None:
        print(f"VRP returned no solution for area '{area}', using sequential order.")
        order = list(range(len(points))) + [0]

    # Build route stop list
    route_result = []
    for idx in order:
        if idx == 0:
            route_result.append({
                "type": "Depot",
                "name": area,
            })
        else:
            row = tps_rows[idx - 1]
            route_result.append({
                "type": "TPS",
                "tps_id": row["tps_id"],
                "kecamatan": row["kecamatan"],
                "priority_rank": row["priority_rank"],
                "prediction": round(row["predicted_volume_percentage"], 4),
                "latitude": row["latitude"],
                "longitude": row["longitude"],
            })

    return route_result


def save_route_recommendation(
    db: Session,
    forecast_batch_id: str,
    coverage_area: str,
    driver_id: int | None,
    route_stops: list[dict],
) -> RouteRecommendation:
    """Persist a single area route recommendation to the database."""
    rec = RouteRecommendation(
        forecast_batch_id=forecast_batch_id,
        coverage_area=coverage_area,
        driver_id=driver_id,
        total_stops=sum(1 for s in route_stops if s["type"] == "TPS"),
        route_json=json.dumps(route_stops, ensure_ascii=False),
        status="Pending",
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec

def generate_routes(db: Session | None = None) -> None:
    own_db = db is None
    if own_db:
        db = SessionLocal()

    try:
        print("[RouteScheduler] Fetching latest forecast...")

        result = fetch_latest_forecast(db)
        if not result:
            print("[RouteScheduler] No forecast data. Aborting.")
            return

        forecast_rows, forecast_batch_id = result
        print(f"[RouteScheduler] Batch: {forecast_batch_id} | Rows: {len(forecast_rows)}")

        print("[RouteScheduler] Fetching drivers...")
        driver_list = fetch_drivers(db)

        print("[RouteScheduler] Loading depot config...")
        depots = load_depots()

        # Group TPS rows by coverage_area
        area_tps: dict[str, list[dict]] = {}
        for row in forecast_rows:
            area = row["coverage_area"]
            if area is None:
                print(f"[RouteScheduler] kecamatan '{row['kecamatan']}' has no area mapping, skipping.")
                continue
            area_tps.setdefault(area, []).append(row)

        # Build driver lookup by coverage_area (first available driver per area)
        driver_by_area: dict[str, dict] = {}
        for d in driver_list:
            area = d["coverage_area"]
            if area and area not in driver_by_area:
                driver_by_area[area] = d

        # Process each area
        saved = 0
        for area, tps_rows in area_tps.items():
            driver = driver_by_area.get(area)
            if not driver:
                print(f"[RouteScheduler] No driver for area '{area}', skipping.")
                continue

            print(f"[RouteScheduler] Solving VRP for '{area}' ({len(tps_rows)} TPS stops)...")

            route_stops = build_area_route(area, tps_rows, driver, depots)
            if not route_stops:
                continue

            save_route_recommendation(
                db=db,
                forecast_batch_id=forecast_batch_id,
                coverage_area=area,
                driver_id=driver["id"],
                route_stops=route_stops,
            )

            saved += 1
            print(f"[RouteScheduler] Saved route for '{area}' (driver: {driver['name']}).")

        print(f"[RouteScheduler] Done. Saved {saved} route recommendations.")

    finally:
        if own_db:
            db.close()
