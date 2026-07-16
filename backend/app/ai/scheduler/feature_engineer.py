import random
from datetime import datetime, timedelta
from app.utils.timezone import get_jakarta_now
import requests
from sqlalchemy.orm import Session, joinedload

from app.database.database import SessionLocal

from app.models.users import User
from app.models.zones import Zone
from app.models.drivers import Driver
from app.models.historical_waste_data import HistoricalWasteData

from app.ai.data.zone_population import ZONE_POPULATION
from app.ai.data.tps_capacity import TPS_CAPACITY

features = [
    'kecamatan', 
    'tps_id', 
    'tps_type', 
    'zone_population', 
    'tps_capacity_kg',
    'day_of_week', 
    'is_weekend', 
    'is_holiday', 
    'daily_growth_rate',
    'rainfall_today', 
    'event_urgency_score', 
    'current_fill_percentage'
]

# Collect Historical Data

def get_registered_tps(db: Session):
    return db.query(Zone).all()

def get_drivers(db: Session):
    return db.query(User).options(joinedload(User.fleet)).filter(User.role == "driver").all()


def get_zone_population(kecamatan):
    return ZONE_POPULATION.get(kecamatan.title(), 30000)


def get_tps_capacity(tps_id):
    # normalize: zone.id int, HistoricalWasteData.tps_id sometimes str in old seeds
    try:
        key = int(tps_id)
    except Exception:
        key = tps_id
    return TPS_CAPACITY.get(key, 5000)


def get_temporal():
    now = get_jakarta_now()

    return {
        "timestamp_prediction": now,
        "day_of_week": now.weekday(),
        "is_weekend": int(now.weekday() >= 5)
    }


# ponytail: Caches rainfall per kecamatan for a single run.
# A more robust solution would use a persistent cache like Redis
# with a TTL to avoid hitting the API on every scheduler run.
_rainfall_cache = {}

def get_rainfall(zone: Zone):
    """
    Fetches rainfall for a zone's kecamatan, using a cache to avoid redundant API calls.
    It uses the provided zone's lat/lon for the API call if the kecamatan is not already cached.
    """
    kecamatan = zone.kecamatan
    if kecamatan in _rainfall_cache:
        return _rainfall_cache[kecamatan]

    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={zone.latitude}"
        f"&longitude={zone.longitude}"
        "&daily=precipitation_sum"
        "&forecast_days=1"
        "&timezone=Asia%2FBangkok"
    )

    try:
        # Retry once if API returns unexpected structure/status
        for attempt in range(2):
            resp = requests.get(url, timeout=15)
            if resp.status_code != 200:
                snippet = resp.text[:200].replace("\n", " ")
                print(f"OpenMeteo non-200 for {kecamatan}: {resp.status_code} resp_snippet={snippet}")
                if attempt == 0:
                    continue
                resp.raise_for_status()

            # Parse JSON safely
            try:
                data = resp.json()
            except Exception as jerr:
                print(f"Invalid JSON from OpenMeteo for {kecamatan}: {jerr} resp_snippet={resp.text[:200]}")
                if attempt == 0:
                    continue
                raise

            daily = data.get("daily") or {}
            sums = daily.get("precipitation_sum")

            if isinstance(sums, list) and sums:
                rainfall = float(sums[0])
                _rainfall_cache[kecamatan] = rainfall
                return rainfall

            # Log response for debugging, retry once
            print(f"OpenMeteo missing precipitation_sum for {kecamatan}: keys={list(data.keys())} resp_snippet={resp.text[:200]}")
            if attempt == 0:
                continue
            raise KeyError("missing daily.precipitation_sum")
    except Exception as e:
        print(f"Could not fetch rainfall for {kecamatan}, using random value. Error: {e}")
        # Cache random to keep consistent per kecamatan in this run
        random_rainfall = round(random.uniform(0, 15), 2)
        _rainfall_cache[kecamatan] = random_rainfall
        return random_rainfall


def get_previous_history(db: Session, tps_id):

    return (
        db.query(HistoricalWasteData)
        .filter(HistoricalWasteData.tps_id == str(tps_id))
        .order_by(HistoricalWasteData.timestamp_prediction.desc())
        .first()
    )


def get_growth_rate(rainfall, event_score):

    growth = (
        random.uniform(3,6)
        + rainfall*0.15
        + event_score*2.5
    )

    return round(growth, 2)


def get_current_fill(previous):

    # First day
    if previous is None:
        return round(random.uniform(15, 35), 2)

    current_fill = previous.current_fill_percentage

    # Waste accumulates
    current_fill += previous.daily_growth_rate

    # Small randomness
    current_fill += random.uniform(-2, 2)

    return round(max(0, min(current_fill, 100)), 2)

def collect_waste(current_fill_percentage, tps_capacity_kg, truck_capacity_kg):

    current_waste_kg = (current_fill_percentage / 100) * tps_capacity_kg

    collected_kg = min(current_waste_kg, truck_capacity_kg)

    remaining_waste_kg = current_waste_kg - collected_kg

    new_fill_percentage = (
        remaining_waste_kg / tps_capacity_kg
    ) * 100

    return round(new_fill_percentage, 2), collected_kg


def get_event_score():
    return 0.0


# Build Historical Data

def build_feature_row(db: Session, zone: Zone, rainfall: float):
    """Builds a feature row for a given zone and pre-fetched rainfall."""
    previous = get_previous_history(db, zone.id)

    temporal = get_temporal()

    event_score = get_event_score()

    growth_rate = get_growth_rate(rainfall, event_score)

    feature = {
        "kecamatan": zone.kecamatan,
        "tps_id": str(zone.id),
        "tps_type": zone.jenis_tps,
        "zone_population": get_zone_population(zone.kecamatan),
        "tps_capacity_kg": get_tps_capacity(zone.id),
        "day_of_week": temporal["day_of_week"],
        "is_weekend": temporal["is_weekend"],
        "is_holiday": 0,
        "daily_growth_rate": growth_rate,
        "rainfall_today": rainfall,
        "event_urgency_score": event_score,
        "current_fill_percentage": get_current_fill(previous),
        "timestamp_prediction": temporal["timestamp_prediction"]
    }

    return feature


def collect_daily_data():
    """
    Collects and stores daily waste data features for all registered TPS zones.
    Rainfall data is fetched once per kecamatan to improve efficiency.
    """
    db = SessionLocal()
    try:
        zones = get_registered_tps(db)
        
        # Clear the cache at the beginning of each run
        _rainfall_cache.clear()

        for zone in zones:
            # get_rainfall will fetch and cache the data on the first call for a kecamatan
            rainfall = get_rainfall(zone)
            
            # Pass the fetched/cached rainfall value to build the feature row
            feature = build_feature_row(db, zone, rainfall)

            db.add(HistoricalWasteData(**feature))

        db.commit()
        print(f"Inserted {len(zones)} historical records.")
    except Exception as e:
        print(f"An error occurred during daily data collection: {e}")
        db.rollback()
    finally:
        db.close()
