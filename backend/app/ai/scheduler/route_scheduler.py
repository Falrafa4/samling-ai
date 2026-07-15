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
from app.models.historical_waste_data import HistoricalWasteData

from ortools.constraint_solver import pywrapcp, routing_enums_pb2

DEPOTS_PATH = os.path.join(
    os.path.dirname(__file__),
    "../../core/depots.json"
)
FINISH_POINT = {
    "name": "TPST Bantar Gebang",
    "latitude": -6.348984,
    "longitude": 106.993631,
}

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

    # Get the latest historical data entry for each TPS to find its capacity
    latest_historical_subquery = (
        db.query(
            HistoricalWasteData.tps_id,
            func.max(HistoricalWasteData.timestamp_prediction).label("latest_ts")
        )
        .group_by(HistoricalWasteData.tps_id)
        .subquery()
    )

    tps_capacity_map = {
        r.tps_id: r.tps_capacity_kg
        for r in db.query(
            HistoricalWasteData.tps_id,
            HistoricalWasteData.tps_capacity_kg
        ).join(
            latest_historical_subquery,
            (HistoricalWasteData.tps_id == latest_historical_subquery.c.tps_id) &
            (HistoricalWasteData.timestamp_prediction == latest_historical_subquery.c.latest_ts)
        ).all()
    }

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
        
        tps_capacity_kg = tps_capacity_map.get(p.tps_id)
        if tps_capacity_kg is None:
            print(f"Capacity not found for tps_id={p.tps_id}, skipping.")
            continue

        waste_volume_kg = (p.predicted_volume_percentage / 100) * tps_capacity_kg
        kecamatan = p.kecamatan
        coverage_area = AREA_MAPPING.get(kecamatan)

        rows.append({
            "forecast_batch_id": p.forecast_batch_id,
            "tps_id": p.tps_id,
            "kecamatan": kecamatan,
            "predicted_volume_percentage": p.predicted_volume_percentage,
            "tps_capacity_kg": tps_capacity_kg,
            "waste_volume_kg": waste_volume_kg,
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

def assign_routes_for_area(
    area: str,
    tps_rows: list[dict],
    drivers: list[dict],
    depots: dict,
) -> list[tuple[int, list[dict]]]:
    """
    Builds and assigns routes for an area based on driver capacity.
    Returns a list of tuples: (driver_id, route_stops).
    """
    depot = depots.get(area)
    if not depot:
        print(f"No depot config for area '{area}', skipping.")
        return []
    
    if not drivers:
        print(f"No available drivers for area '{area}', skipping.")
        return []

    # Sort TPS by priority
    tps_rows.sort(key=lambda x: x["priority_rank"])

    routes = []
    driver_idx = 0

    while tps_rows and driver_idx < len(drivers):
        current_driver = drivers[driver_idx]
        driver_capacity_kg = current_driver.get("truck_capacity_kg") or 0
        current_load_kg = 0
        
        stops_for_this_route = []
        
        # Greedily assign TPS to the current driver
        remaining_tps = []
        for tps in tps_rows:
            if current_load_kg + tps["waste_volume_kg"] <= driver_capacity_kg:
                stops_for_this_route.append(tps)
                current_load_kg += tps["waste_volume_kg"]
            else:
                remaining_tps.append(tps)
        
        if not stops_for_this_route:
            # Current driver can't even handle the first TPS, move to next driver
            driver_idx += 1
            continue

        # VRP for the assigned stops
        points = [(depot["latitude"], depot["longitude"])]
        points += [(row["latitude"], row["longitude"]) for row in stops_for_this_route]
        points.append((FINISH_POINT["latitude"], FINISH_POINT["longitude"]))
        
        distance_matrix = build_distance_matrix(points)
        
        # We need a custom VRP solver that handles a fixed finish point
        # For now, let's adapt the existing one. The finish point is the last index.
        num_locations = len(points)
        depot_index = 0
        finish_index = num_locations - 1

        manager = pywrapcp.RoutingIndexManager(num_locations, 1, [depot_index], [finish_index])
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

        if solution:
            # Build ordered list of stops from VRP solution
            ordered_stops = []
            index = routing.Start(0)
            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                if node_index != depot_index and node_index != finish_index:
                     ordered_stops.append(stops_for_this_route[node_index - 1])
                index = solution.Value(routing.NextVar(index))
        else:
            print(f"VRP failed for driver {current_driver['id']}, using sequential order.")
            ordered_stops = stops_for_this_route # Fallback to priority order

        # Final route structure
        final_route = [{"type": "Depot", "name": area}]
        for stop in ordered_stops:
            final_route.append({
                "type": "TPS",
                "tps_id": stop["tps_id"],
                "kecamatan": stop["kecamatan"],
                "priority_rank": stop["priority_rank"],
                "prediction": round(stop["predicted_volume_percentage"], 4),
                "tps_capacity_kg": stop.get("tps_capacity_kg"),
                "waste_volume_kg": round(stop.get("waste_volume_kg", 0.0), 2),
                "latitude": stop["latitude"],
                "longitude": stop["longitude"],
            })
        final_route.append({"type": "Finish", "name": FINISH_POINT["name"]})
        
        routes.append((current_driver["id"], final_route))

        tps_rows = remaining_tps
        driver_idx += 1

    if tps_rows:
        print(f"[Warning] Ran out of drivers for area '{area}'. {len(tps_rows)} TPS remain unassigned.")
        
    return routes


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

        # --- Prevent Duplicates ---
        existing_routes = db.query(RouteRecommendation).filter_by(forecast_batch_id=forecast_batch_id).all()
        if existing_routes:
            print(f"[RouteScheduler] Deleting {len(existing_routes)} existing routes for batch {forecast_batch_id}.")
            for route in existing_routes:
                db.delete(route)
            db.commit()

        print("[RouteScheduler] Fetching drivers...")
        driver_list = fetch_drivers(db)

        print("[RouteScheduler] Loading depot config...")
        depots = load_depots()

        # Group TPS and drivers by coverage_area
        area_tps: dict[str, list[dict]] = {}
        for row in forecast_rows:
            area = row.get("coverage_area")
            if area:
                area_tps.setdefault(area, []).append(row)

        drivers_by_area: dict[str, list[dict]] = {}
        for d in driver_list:
            area = d.get("coverage_area")
            if area:
                drivers_by_area.setdefault(area, []).append(d)

        # Process each area
        saved_count = 0
        for area, tps_in_area in area_tps.items():
            drivers_in_area = drivers_by_area.get(area, [])
            if not drivers_in_area:
                print(f"[RouteScheduler] No drivers for area '{area}', skipping.")
                continue
            
            # Sort drivers by capacity, largest first, to be more efficient
            drivers_in_area.sort(key=lambda x: x.get("truck_capacity_kg") or 0, reverse=True)

            print(f"[RouteScheduler] Assigning routes for '{area}' ({len(tps_in_area)} TPS, {len(drivers_in_area)} drivers)...")
            
            generated_routes = assign_routes_for_area(
                area=area,
                tps_rows=tps_in_area,
                drivers=drivers_in_area,
                depots=depots,
            )

            if not generated_routes:
                print(f"[RouteScheduler] No routes could be generated for area '{area}'.")
                continue

            for driver_id, route_stops in generated_routes:
                rec = save_route_recommendation(
                    db=db,
                    forecast_batch_id=forecast_batch_id,
                    coverage_area=area,
                    driver_id=driver_id,
                    route_stops=route_stops,
                )
                saved_count += 1
                driver_name = next((d['name'] for d in drivers_in_area if d['id'] == driver_id), 'Unknown')
                print(f"[RouteScheduler] Saved route for '{area}' (ID: {rec.id}, Driver: {driver_name}).")

        print(f"[RouteScheduler] Done. Saved {saved_count} route recommendations.")

    finally:
        if own_db:
            db.close()
