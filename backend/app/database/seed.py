import sys
import os
from datetime import datetime, timedelta, timezone
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.database.database import SessionLocal
from app.models.users import User
from app.models.zones import Zone
from app.models.sensor_data import SensorData
from app.models.volume_predictions import VolumePrediction
from app.models.citizen_reports import CitizenReport
from app.models.route_recommendations import RouteRecommendation
from app.models.fleets import Fleet
from app.utils.security import get_password_hash

DATA_DIR = os.path.join(os.path.dirname(__file__), "../../data")
JSON_PATH = os.path.join(DATA_DIR, "tps_priority_dki_enriched.json")


def seed_data():
    db = SessionLocal()
    try:
        print("Memulai proses seeding data...")

        # Clean existing data
        db.query(SensorData).delete()
        db.query(VolumePrediction).delete()
        db.query(CitizenReport).delete()
        db.query(RouteRecommendation).delete()
        db.query(User).delete()
        db.query(Zone).delete()
        db.query(Fleet).delete()
        db.commit()
        print("Data lama berhasil dibersihkan.")

        # 1. Seed Users (Admin)
        admin_user = User(
            name="Super Admin Samling",
            username="admin_samling",
            password=get_password_hash("supersecurepassword"),
            role="admin",
            status=None
        )
        db.add(admin_user)
        print("User admin berhasil di-seed.")

        # 2. Seed Zones from enriched JSON
        if not os.path.exists(JSON_PATH):
            print(f"ERROR: File JSON tidak ditemukan di {JSON_PATH}")
            print("Jalankan script convert_csv_to_json.py terlebih dahulu.")
            db.rollback()
            return

        def normalize_kecamatan(raw):
            title = raw.strip().title()
            mapping = {
                "Kramatjati": "Kramat Jati",
                "Tamansari": "Taman Sari",
                "Pulau Seribu Selatan": "Kepulauan Seribu Selatan",
                "Pulau Seribu Utara": "Kepulauan Seribu Utara",
                "Pal Merah": "Palmerah",
            }
            return mapping.get(title, title)

        def normalize_wilayah(raw):
            key = raw.strip().lower()
            key = key.replace("kota adm. ", "").replace("kab. adm. ", "")
            key = key.replace("kota adm ", "").replace("kab adm ", "")
            key = key.replace(".", "").replace(",", "").strip()
            mapping = {
                "jakarta pusat": "Jakarta Pusat",
                "jakarta utara": "Jakarta Utara",
                "jakarta barat": "Jakarta Barat",
                "jakarta selatan": "Jakarta Selatan",
                "jakarta timur": "Jakarta Timur",
                "kepulauan seribu": "Kepulauan Seribu",
                "kep seribu": "Kepulauan Seribu",
            }
            return mapping.get(key, raw.strip())

        with open(JSON_PATH, encoding="utf-8") as f:
            tps_list = json.load(f)

        zones_data = []
        for tps in tps_list:
            zone = Zone(
                name=tps["name"],
                wilayah=normalize_wilayah(tps.get("wilayah", "")),
                kecamatan=normalize_kecamatan(tps.get("kecamatan", "")),
                kelurahan=tps.get("kelurahan", "").strip().title(),
                jenis_tps=tps.get("jenis_tps", "").strip().title(),
                alamat=tps.get("alamat", "").strip(),
                latitude=tps["latitude"],
                longitude=tps["longitude"],
                risk_status=tps.get("risk_status", "Normal"),
            )
            zones_data.append(zone)

        db.add_all(zones_data)
        db.commit()
        print(f"Tabel zones ({len(zones_data)} TPS) berhasil di-seed.")

        # Refresh zone references for related data
        all_zones = db.query(Zone).order_by(Zone.id).all()

        # Use first 5 TPS for sample operational data
        zone_sample = all_zones[:5] if len(all_zones) >= 5 else all_zones
        if len(zone_sample) < 5:
            print(f"WARNING: Hanya {len(zone_sample)} TPS tersedia, sample data disesuaikan.")
            zone_sample = (zone_sample * 5)[:5]

        # 3. Seed Fleets (Data Peremajaan & Statistik Operasional DLH DKI Jakarta 2024/2025)
        fleets_data = [
            # Hulu (Kolektor Lingkungan)
            Fleet(name="Motor Gerobak (Mobet)", category="Hulu", type="Motor Gerobak", capacity="2 m3", total_units=200),
            Fleet(name="Gerobak Manual", category="Hulu", type="Gerobak", capacity="1 m3", total_units=100),
            Fleet(name="Mini Dump Truck", category="Hulu", type="Mini Dump Truck", capacity="3 m3", total_units=190),
            # Tengah (Transpor Makro)
            Fleet(name="Arm Roll Kecil", category="Tengah", type="Arm Roll", capacity="3 Ton", total_units=200),
            Fleet(name="Arm Roll Besar", category="Tengah", type="Arm Roll", capacity="5 Ton", total_units=143),
            Fleet(name="Dump Truck Besar", category="Tengah", type="Dump Truck", capacity="8 Ton", total_units=557),
            Fleet(name="Truk Compactor RDF", category="Tengah", type="Compactor", capacity="5 Ton", total_units=148),
            Fleet(name="Truk Tronton", category="Tengah", type="Truk Tronton", capacity="10 Ton", total_units=25),
            Fleet(name="Road Sweeper", category="Tengah", type="Sweeper", capacity="Penyapu Jalan", total_units=48),
            # Hilir (Alat Berat TPST)
            Fleet(name="Excavator Standard", category="Hilir", type="Excavator", capacity="Alat Berat", total_units=33),
            Fleet(name="Excavator Long Arm", category="Hilir", type="Excavator", capacity="Alat Berat", total_units=2),
            Fleet(name="Bulldozer", category="Hilir", type="Bulldozer", capacity="Alat Berat", total_units=14),
            Fleet(name="Wheel Loader", category="Hilir", type="Loader", capacity="Alat Berat", total_units=11),
        ]
        db.add_all(fleets_data)
        db.commit()
        print("Tabel fleets (Armada DLH DKI Jakarta) berhasil di-seed.")

        # Ambil referensi fleet untuk dihubungkan ke driver
        f_dump = db.query(Fleet).filter(Fleet.name == "Dump Truck Besar").first()
        f_ar_besar = db.query(Fleet).filter(Fleet.name == "Arm Roll Besar").first()
        f_compactor = db.query(Fleet).filter(Fleet.name == "Truk Compactor RDF").first()
        f_ar_kecil = db.query(Fleet).filter(Fleet.name == "Arm Roll Kecil").first()
        f_tronton = db.query(Fleet).filter(Fleet.name == "Truk Tronton").first()

        # 4. Seed Drivers (Linked to Fleets)
        drivers_data = [
            User(name="Budi Utomo", username="driver_budi", password=get_password_hash("driver123"), role="driver", whatsapp_number="6281234567890", fleet_id=f_dump.id if f_dump else None, status="Offline"),
            User(name="Joko Susilo", username="driver_joko", password=get_password_hash("driver123"), role="driver", whatsapp_number="6281298765432", fleet_id=f_ar_besar.id if f_ar_besar else None, status="Offline"),
            User(name="Agus Saputra", username="driver_agus", password=get_password_hash("driver123"), role="driver", whatsapp_number="6281311223344", fleet_id=f_compactor.id if f_compactor else None, status="Offline"),
            User(name="Herman Wijaya", username="driver_herman", password=get_password_hash("driver123"), role="driver", whatsapp_number="6281355667788", fleet_id=f_ar_kecil.id if f_ar_kecil else None, status="Offline"),
            User(name="Rudy Hermawan", username="driver_rudy", password=get_password_hash("driver123"), role="driver", whatsapp_number="6281288990011", fleet_id=f_tronton.id if f_tronton else None, status="Offline"),
        ]
        db.add_all(drivers_data)
        db.commit()
        print("Tabel users (5 driver ber-armada) berhasil di-seed.")

        # 4. Seed SensorData
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        sensor_data_records = []
        import random
        random.seed(42)

        for i, zone in enumerate(zone_sample):
            # Seed fresh sensor data dengan nilai 0 (seolah baru dipasang)
            sensor_data_records.extend([
                SensorData(zone_id=zone.id, sensor_type="Ultrasonic-Organic", fill_percentage=0.0, value=0.0, created_at=now, updated_at=now),
                SensorData(zone_id=zone.id, sensor_type="Ultrasonic-Anorganic", fill_percentage=0.0, value=0.0, created_at=now, updated_at=now),
                SensorData(zone_id=zone.id, sensor_type="MQ-135", fill_percentage=0.0, value=0.0, created_at=now, updated_at=now),
                SensorData(zone_id=zone.id, sensor_type="DHT-22-Temp", fill_percentage=0.0, value=0.0, created_at=now, updated_at=now),
                SensorData(zone_id=zone.id, sensor_type="DHT-22-Humid", fill_percentage=0.0, value=0.0, created_at=now, updated_at=now)
            ])

            # Karena kosong, set status risiko ke Normal
            zone.risk_status = "Normal"

        db.add_all(sensor_data_records)
        print(f"Tabel sensor_data ({len(sensor_data_records)} data pembacaan IoT fresh bernilai 0) berhasil di-seed.")

        # 5. Seed VolumePredictions
        zone1 = zone_sample[0]
        zone2 = zone_sample[1]
        zone3 = zone_sample[2]
        zone4 = zone_sample[3]
        zone5 = zone_sample[4]

        prediction_records = []

        prediction_records.extend([
            VolumePrediction(zone_id=zone1.id, predicted_volume=90.0, target_time=now + timedelta(days=1), confidence_score=0.95),
            VolumePrediction(zone_id=zone1.id, predicted_volume=95.0, target_time=now + timedelta(days=2), confidence_score=0.90),
            VolumePrediction(zone_id=zone1.id, predicted_volume=100.0, target_time=now + timedelta(days=3), confidence_score=0.85),
            VolumePrediction(zone_id=zone1.id, predicted_volume=105.0, target_time=now + timedelta(days=4), confidence_score=0.80),
        ])
        prediction_records.extend([
            VolumePrediction(zone_id=zone2.id, predicted_volume=30.0, target_time=now + timedelta(days=1), confidence_score=0.98),
            VolumePrediction(zone_id=zone2.id, predicted_volume=35.0, target_time=now + timedelta(days=2), confidence_score=0.95),
            VolumePrediction(zone_id=zone2.id, predicted_volume=40.0, target_time=now + timedelta(days=3), confidence_score=0.92),
            VolumePrediction(zone_id=zone2.id, predicted_volume=45.0, target_time=now + timedelta(days=4), confidence_score=0.89),
        ])
        prediction_records.extend([
            VolumePrediction(zone_id=zone3.id, predicted_volume=70.0, target_time=now + timedelta(days=1), confidence_score=0.94),
            VolumePrediction(zone_id=zone3.id, predicted_volume=75.0, target_time=now + timedelta(days=2), confidence_score=0.88),
            VolumePrediction(zone_id=zone3.id, predicted_volume=80.0, target_time=now + timedelta(days=3), confidence_score=0.85),
            VolumePrediction(zone_id=zone3.id, predicted_volume=85.0, target_time=now + timedelta(days=4), confidence_score=0.80),
        ])
        prediction_records.extend([
            VolumePrediction(zone_id=zone4.id, predicted_volume=20.0, target_time=now + timedelta(days=1), confidence_score=0.97),
            VolumePrediction(zone_id=zone4.id, predicted_volume=25.0, target_time=now + timedelta(days=2), confidence_score=0.94),
            VolumePrediction(zone_id=zone4.id, predicted_volume=30.0, target_time=now + timedelta(days=3), confidence_score=0.90),
            VolumePrediction(zone_id=zone4.id, predicted_volume=35.0, target_time=now + timedelta(days=4), confidence_score=0.85),
        ])
        prediction_records.extend([
            VolumePrediction(zone_id=zone5.id, predicted_volume=75.0, target_time=now + timedelta(days=1), confidence_score=0.93),
            VolumePrediction(zone_id=zone5.id, predicted_volume=80.0, target_time=now + timedelta(days=2), confidence_score=0.90),
            VolumePrediction(zone_id=zone5.id, predicted_volume=85.0, target_time=now + timedelta(days=3), confidence_score=0.86),
            VolumePrediction(zone_id=zone5.id, predicted_volume=90.0, target_time=now + timedelta(days=4), confidence_score=0.80),
        ])

        db.add_all(prediction_records)
        print("Tabel volume_predictions (20 data proyeksi) berhasil di-seed.")

        # 6. Seed CitizenReports
        citizen_reports_data = [
            CitizenReport(
                whatsapp_number="6281234567890",
                report_content="Ada tumpukan sampah plastik menumpuk banyak di dekat gerbang TPS, tolong segera diangkut.",
                zone_id=zone1.id,
                status="Baru",
                is_grouped=True,
                image_path="uploads/placeholder.avif",
                created_at=now - timedelta(hours=4)
            ),
            CitizenReport(
                whatsapp_number="6281298765432",
                report_content="Tolong angkut sampah plastik menumpuk di gerbang TPS, baunya mulai mengganggu.",
                zone_id=zone1.id,
                status="Baru",
                is_grouped=True,
                image_path="uploads/placeholder.avif",
                created_at=now - timedelta(hours=2)
            ),
            CitizenReport(
                whatsapp_number="6281311112222",
                report_content="Laporan bak sampah di TPS jebol pada bagian penahan bawah.",
                zone_id=zone1.id,
                status="Sedang Ditangani",
                is_grouped=False,
                image_path=None,
                created_at=now - timedelta(days=1)
            ),
            CitizenReport(
                whatsapp_number="6281255556666",
                report_content="Sampah daun kering berserakan di depan TPS.",
                zone_id=zone2.id,
                status="Selesai",
                is_grouped=False,
                image_path="uploads/placeholder.avif",
                created_at=now - timedelta(days=3)
            ),
            CitizenReport(
                whatsapp_number="6281288889999",
                report_content="Sampah basah menumpuk banyak di TPS, baunya menyengat.",
                zone_id=zone3.id,
                status="Baru",
                is_grouped=True,
                image_path=None,
                created_at=now - timedelta(hours=5)
            ),
            CitizenReport(
                whatsapp_number="6281344445555",
                report_content="Baunya menyengat sekali dari tumpukan sampah basah di TPS. Mohon dikirim supir pengangkut.",
                zone_id=zone3.id,
                status="Baru",
                is_grouped=True,
                image_path="uploads/placeholder.avif",
                created_at=now - timedelta(hours=3)
            ),
            CitizenReport(
                whatsapp_number="6281277778888",
                report_content="Warga membuang kasur bekas sembarangan di luar TPS.",
                zone_id=zone3.id,
                status="Baru",
                is_grouped=False,
                image_path=None,
                created_at=now - timedelta(hours=8)
            ),
            CitizenReport(
                whatsapp_number="6281322223333",
                report_content="Ada sampah sisa material bangunan dibuang di depan TPS.",
                zone_id=zone4.id,
                status="Baru",
                is_grouped=False,
                image_path="uploads/placeholder.avif",
                created_at=now - timedelta(hours=6)
            ),
            CitizenReport(
                whatsapp_number="6281366667777",
                report_content="Tumpukan sampah pasar meluap hingga memakan bahu jalan di TPS.",
                zone_id=zone5.id,
                status="Sedang Ditangani",
                is_grouped=False,
                image_path=None,
                created_at=now - timedelta(hours=14)
            ),
            CitizenReport(
                whatsapp_number="6281211223344",
                report_content="Lampu penerangan di TPS mati sejak kemarin malam.",
                zone_id=zone5.id,
                status="Selesai",
                is_grouped=False,
                image_path="uploads/placeholder.avif",
                created_at=now - timedelta(days=2)
            ),
        ]
        db.add_all(citizen_reports_data)
        print("Tabel citizen_reports (10 data aduan warga) berhasil di-seed.")

        # 7. Seed RouteRecommendations
        tps_ids_ordered = [zone_sample[0].id, zone_sample[2].id, zone_sample[4].id, zone_sample[1].id, zone_sample[3].id]
        all_drivers = db.query(User).filter(User.role == "driver").all()
        route_recommendation = RouteRecommendation(
            driver_id=None,
            route_json=json.dumps(tps_ids_ordered),
            status="Pending",
            created_at=now - timedelta(hours=1)
        )
        db.add(route_recommendation)
        print("Tabel route_recommendations (1 rute) berhasil di-seed.")

        db.commit()
        print("Seeding selesai dengan sukses!")

    except Exception as e:
        db.rollback()
        print(f"Terjadi kesalahan saat seeding: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
