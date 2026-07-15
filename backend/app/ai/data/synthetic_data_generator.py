import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Pastikan API FastAPI kamu menyala, atau gunakan dummy zones jika API mati
API_URL = "http://127.0.0.1:8000/api/v1/zones"

START_DATE = datetime(2025, 1, 1, 6, 0, 0)
END_DATE = datetime(2026, 6, 30, 6, 0, 0)

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

try:
    response = requests.get(API_URL)
    response.raise_for_status()
    zones = response.json()["data"]
except Exception as e:
    print(f"Gagal mengambil data API: {e}. Pastikan backend menyala.")
    zones = [] # Fallback

records = []

for zone in zones:
    kecamatan = zone["kecamatan"]
    tps_id = zone["id"]
    tps_type = zone["jenis_tps"]

    # Berikan populasi logis untuk TPS
    zone_population = ZONE_POPULATION[kecamatan]

    # Sesuaikan kapasitas TPS
    if tps_type == "Tipe 1":
        tps_capacity = np.random.randint(1000, 3000)
    elif tps_type == "Tipe 2":
        tps_capacity = np.random.randint(1000, 3000)
    elif tps_type == "Tipe 3":
        tps_capacity = np.random.randint(3000, 5000)
    else:
        tps_capacity = np.random.randint(5000, 10000)

    current_date = START_DATE
    current_fill = np.random.uniform(5, 20) # Awal tahun TPS kosong

    # Pre-fetch historical precipitation for the whole date range for this zone
    precipitation_list = None
    start_date_only = START_DATE.date()
    try:
        resp = requests.get(
            "https://archive-api.open-meteo.com/v1/era5",
            params={
                "latitude": zone.get("latitude", zone.get("lat", None)),
                "longitude": zone.get("longitude", zone.get("lon", None)),
                "daily": "precipitation_sum",
                "start_date": START_DATE.date().isoformat(),
                "end_date": END_DATE.date().isoformat(),
                "timezone": "Asia/Bangkok"
            },
            timeout=20,
        )
        resp.raise_for_status()
        pdata = resp.json()
        precipitation_list = pdata.get("daily", {}).get("precipitation_sum", [])
    except Exception as e:
        print(f"Warning: failed to fetch historical precipitation for zone {tps_id}: {e}")
        precipitation_list = None

    while current_date <= END_DATE:
        day_of_week = current_date.weekday()
        is_weekend = 1 if day_of_week >= 5 else 0
        is_holiday = 1 if np.random.random() > 0.95 else 0

        # 1. FITUR DIKETAHUI JAM 06:00 (Bahan Belajar AI)
        
        # Laju pertumbuhan sampah TADI MALAM (Overnight growth)
        # Inilah fitur "daily_growth_rate" yang sah secara MLOps
        overnight_growth = np.random.uniform(0.5, 3.0) 
        current_fill = min(current_fill + overnight_growth, 120.0)

        # Cuaca dan Event hari ini (Forecasted at 6 AM)
        if precipitation_list:
            idx = (current_date.date() - start_date_only).days
            if 0 <= idx < len(precipitation_list):
                rainfall = float(precipitation_list[idx])
            else:
                rainfall = 0.0
        else:
            rainfall = np.random.exponential(scale=10) if np.random.random() > 0.7 else 0.0

        event_score = round(np.random.uniform(2.0, 5.0), 1) if np.random.random() > 0.9 else 0.0

        # 2. HIDDEN ACTUAL GROWTH (Pertumbuhan Riil Menuju Jam 09:00 / Sore)
        # INI RUMUS RAHASIA - Model AI harus berusaha menebak ini dari fitur di atas!
        
        # Faktor Kepadatan (Makin padat = Makin banyak sampah)
        density_multiplier = zone_population / 100000.0  

        true_growth = (
            np.random.uniform(10, 20) * density_multiplier
            + is_weekend * np.random.uniform(5, 10)
            + is_holiday * np.random.uniform(10, 15)
            + event_score * np.random.uniform(3, 6)
        )

        # Efek Cuaca (Hujan deras menghambat buang sampah, tapi bikin basah/berat)
        if rainfall > 20:
            true_growth -= np.random.uniform(2, 5) # Warga malas keluar
        elif rainfall > 0:
            true_growth += np.random.uniform(1, 3) # Basah

        # Tambahkan NOISE / Variance alami agar Akurasi tidak 0.9999 (Tidak Masuk Akal)
        noise = np.random.normal(0, 4.0)
        true_growth = max(true_growth + noise, 0) # Growth tidak mungkin minus
        
        # 3. TARGET (Fakta di Lapangan)
        target_fill = min(current_fill + true_growth, 120.0)

        records.append({
            "kecamatan": kecamatan,
            "tps_id": tps_id,
            "tps_type": tps_type,
            "zone_population": zone_population,
            "tps_capacity_kg": tps_capacity,
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "is_holiday": is_holiday,
            "daily_growth_rate": round(overnight_growth, 2), # Fitur yang aman!
            "rainfall_today": round(rainfall, 2),
            "event_urgency_score": round(event_score, 2),
            "current_fill_percentage": round(current_fill, 2),
            "target_fill_percentage": round(target_fill, 2),
            "timestamp_prediction": current_date.strftime("%Y-%m-%d %H:%M:%S")
        })

        # 4. SIMULASI PENGANGKUTAN OLEH TRUK DLH
        # Jika TPS sudah cukup penuh, truk datang mengosongkan TPS untuk keesokan harinya
        if target_fill > 60:
            current_fill = np.random.uniform(5, 15) # Sisa sampah di dasar TPS
        else:
            current_fill = target_fill # Tidak diangkut, menumpuk ke besok

        current_date += timedelta(days=1)

# Simpan ke CSV
df = pd.DataFrame(records)
df.to_csv("synthetic_data.csv", index=False)
print(f"Data Generator Selesai. Total baris: {len(df)}")