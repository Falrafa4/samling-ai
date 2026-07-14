import random
from datetime import datetime, timedelta
import requests
from sqlalchemy.orm import Session, joinedload

from app.database.database import SessionLocal

from app.models.users import User
from app.models.zones import Zone
from app.models.drivers import Driver
from app.models.historical_waste_data import HistoricalWasteData

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

ZONE_POPULATION = {
    "Cakung": 582666,
    "Kepulauan Seribu Selatan": 13700,
    "Jagakarsa": 387458,
    "Jatinegara": 318382,
    "Makasar": 221047,
    "Menteng": 85016,
    "Tebet": 222340,
    "Pesanggrahan": 286820,
    "Johar Baru": 134250,
    "Kalideres": 441860,
    "Cengkareng": 562291,
    "Tanjung Priok": 418090,
    "Kepulauan Seribu Utara": 15500,
    "Duren Sawit": 444264,
    "Gambir": 90638,
    "Sawah Besar": 120597,
    "Cempaka Putih": 95404,
    "Mampang Prapatan": 168340,
    "Pulogadung": 296845,
    "Grogol Petamburan": 245120,
    "Cilandak": 219740,
    "Senen": 119388,
    "Penjaringan": 393450,
    "Kemayoran": 246798,
    "Pasar Minggu": 327120,
    "Kembangan": 310860,
    "Pancoran": 164980,
    "Koja": 378250,
    "Palmerah": 199630,
    "Kramat Jati": 316949,
    "Pademangan": 193890,
    "Kebayoran Baru": 164210,
    "Kebayoran Lama": 333540,
    "Kebon Jeruk": 327580,
    "Pasar Rebo": 235825,
    "Kelapa Gading": 162840,
    "Cipayung": 306337,
    "Tanah Abang": 165179,
    "Cilincing": 444380,
    "Tambora": 267980,
    "Ciracas": 319395,
    "Setiabudi": 123540,
    "Matraman": 182809,
    "Taman Sari": 109430
}

TPS_CAPACITY = {
    1: 8456,
    2: 2342,
    3: 1549,
    4: 4476,
    5: 9556,
    6: 8989,
    7: 2749,
    8: 6228,
    9: 8095,
    10: 2341,
    11: 6590,
    12: 2972,
    13: 1165,
    14: 7998,
    15: 7909,
    16: 1113,
    17: 2519,
    18: 8145,
    19: 1155,
    20: 1081,
    21: 4979,
    22: 6272,
    23: 6300,
    24: 1817,
    25: 2776,
    26: 3841,
    27: 6993,
    28: 8689,
    29: 2501,
    30: 2147,
    31: 7487,
    32: 7316,
    33: 1119,
    34: 2017,
    35: 3800,
    36: 8200,
    37: 2224,
    38: 4214,
    39: 9587,
    40: 9930,
    41: 1204,
    42: 2320,
    43: 4010,
    44: 8740,
    45: 1133,
    46: 1937,
    47: 3124,
    48: 9734,
    49: 2428,
    50: 7373,
    51: 6528,
    52: 2665,
    53: 2322,
    54: 8401,
    55: 2098,
    56: 2199,
    57: 4829,
    58: 6871,
    59: 2158,
    60: 2768,
    61: 9504,
    62: 1889,
    63: 8235,
    64: 1653,
    65: 2960,
    66: 9673,
    67: 1631,
    68: 1863,
    69: 8582,
    70: 7408,
    71: 2629,
    72: 1396,
    73: 5584,
    74: 8953,
    75: 1007,
    76: 6678,
    77: 6667,
    78: 2248,
    79: 2338,
    80: 7202,
    81: 1712,
    82: 1471,
    83: 4910,
    84: 6024,
    85: 1321,
    86: 2523,
    87: 4319,
    88: 8141,
    89: 2573,
    90: 2867,
    91: 8859,
    92: 2545,
    93: 2607,
    94: 8474,
    95: 1466,
    96: 1160,
    97: 9185,
    98: 1949,
    99: 6735,
    100: 2148,
    101: 1910,
    102: 6132,
    103: 7686,
    104: 2472,
    105: 7391,
    106: 2598,
    107: 2651,
    108: 7657,
    109: 6923,
    110: 2034,
    111: 1412,
    112: 3328,
    113: 6374,
    114: 9767,
    115: 2556,
    116: 1308,
    117: 4459,
    118: 9043,
    119: 7218,
    120: 1872,
    121: 6839,
    122: 8725,
    123: 1878,
    124: 6794,
    125: 2989,
    126: 2494,
    127: 7946,
    128: 1996,
    129: 5435,
    130: 1978,
    131: 1068,
    132: 6232,
    133: 8788,
    134: 2660,
    135: 1359,
    136: 6662,
    137: 5544,
    138: 5630,
    139: 1362,
    140: 7034,
    141: 1627,
    142: 1383,
    143: 5342,
    144: 8544,
    145: 2786,
    146: 1988,
    147: 6761,
    148: 2655,
    149: 1091,
    150: 6740
}

# Collect Historical Data

def get_registered_tps(db: Session):
    return db.query(Zone).all()

def get_drivers(db: Session):
    return db.query(User).options(joinedload(User.fleet)).filter(User.role == "driver").all()


def get_zone_population(kecamatan):
    return ZONE_POPULATION.get(kecamatan.title(), 30000)


def get_tps_capacity(tps_id):
    return TPS_CAPACITY.get(int(tps_id), 5000)


def get_temporal():
    now = datetime.now()

    return {
        "timestamp_prediction": now,
        "day_of_week": now.weekday(),
        "is_weekend": int(now.weekday() >= 5)
    }


def get_rainfall(zone: Zone):
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={zone.latitude}"
        f"&longitude={zone.longitude}"
        "&daily=precipitation_sum"
        "&forecast_days=1"
        "&timezone=Asia%2FBangkok"
    )

    try:
        data = requests.get(url, timeout=10).json()
        return float(data["daily"]["precipitation_sum"][0])
    except:
        return round(random.uniform(0, 15), 2)


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

def build_feature_row(db: Session, zone: Zone):

    previous = get_previous_history(db, zone.id)

    temporal = get_temporal()

    rainfall = get_rainfall(zone)
    event_score = get_event_score()

    growth_rate = get_growth_rate(rainfall, event_score)

    feature = {
        "kecamatan": zone.kecamatan,
        "tps_id": zone.id,
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

    db = SessionLocal()

    try:
        zones = get_registered_tps(db)

        for zone in zones:

            feature = build_feature_row(db, zone)

            db.add(HistoricalWasteData(**feature))

        db.commit()

        print(f"Inserted {len(zones)} historical records.")

    finally:
        db.close()