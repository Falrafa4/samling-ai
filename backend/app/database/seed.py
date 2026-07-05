import sys
import os
from datetime import datetime, timedelta, timezone
import json

# Menambahkan root directory proyek ke sys.path agar module app dapat ditemukan
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.database.database import SessionLocal, engine
from app.models.users import User
from app.models.zones import Zone
from app.models.drivers import Driver
from app.models.sensor_data import SensorData
from app.models.volume_predictions import VolumePrediction
from app.models.citizen_reports import CitizenReport
from app.models.route_recommendations import RouteRecommendation
from app.utils.security import get_password_hash

def seed_data():
    db = SessionLocal()
    try:
        print("🌱 Memulai proses seeding data dummy...")

        # Bersihkan data lama agar seeder selalu fresh dan tidak memicu constraint/duplikasi
        db.query(Driver).delete()
        db.query(SensorData).delete()
        db.query(VolumePrediction).delete()
        db.query(CitizenReport).delete()
        db.query(RouteRecommendation).delete()
        db.query(Zone).delete()
        db.query(User).delete()
        db.commit()
        print("🗑️ Data lama berhasil dibersihkan.")

        # 1. Seed Users (Admin)
        admin_user = User(
            username="admin_samling",
            password=get_password_hash("supersecurepassword"),
            role="admin"
        )
        db.add(admin_user)
        print("✅ User admin berhasil di-seed.")

        # 2. Seed 5 Zones (Wilayah TPS)
        zones_data = [
            Zone(name="TPS 01 - Kebon Jeruk", latitude=-6.1944, longitude=106.7672, risk_status="High Priority"),
            Zone(name="TPS 02 - Grogol", latitude=-6.1566, longitude=106.7892, risk_status="Normal"),
            Zone(name="TPS 03 - Palmerah", latitude=-6.2084, longitude=106.7992, risk_status="Warning"),
            Zone(name="TPS 04 - Kemanggisan", latitude=-6.2023, longitude=106.7842, risk_status="Normal"),
            Zone(name="TPS 05 - Kembangan", latitude=-6.1843, longitude=106.7342, risk_status="Warning"),
        ]
        db.add_all(zones_data)
        db.commit()  # Commit agar zone_id ter-generate untuk Foreign Key
        print("✅ Tabel zones (5 wilayah TPS) berhasil di-seed.")

        # 3. Seed 5 Drivers
        drivers_data = [
            Driver(name="Budi Utomo", whatsapp_number="6281234567890", zone_id=zones_data[0].id),
            Driver(name="Joko Susilo", whatsapp_number="6281298765432", zone_id=zones_data[1].id),
            Driver(name="Agus Saputra", whatsapp_number="6281311223344", zone_id=zones_data[2].id),
            Driver(name="Herman Wijaya", whatsapp_number="6281355667788", zone_id=zones_data[3].id),
            Driver(name="Rudy Hermawan", whatsapp_number="6281288990011", zone_id=zones_data[4].id),
        ]
        db.add_all(drivers_data)
        print("✅ Tabel drivers (5 driver supir armada) berhasil di-seed.")

        # 4. Seed 15 SensorData (Simulasi Telemetri Nyata)
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        sensor_data_records = []

        # Zone 1 (TPS 01 - Kebon Jeruk) -> Mengisi bertahap hingga High Priority (>80%)
        sensor_data_records.extend([
            SensorData(zone_id=zones_data[0].id, sensor_type="Ultrasonic", fill_percentage=40.0, value=60.0, created_at=now - timedelta(hours=10)),
            SensorData(zone_id=zones_data[0].id, sensor_type="Ultrasonic", fill_percentage=65.0, value=35.0, created_at=now - timedelta(hours=5)),
            SensorData(zone_id=zones_data[0].id, sensor_type="Ultrasonic", fill_percentage=85.0, value=15.0, created_at=now - timedelta(hours=1)),
        ])

        # Zone 2 (TPS 02 - Grogol) -> Stabil di kondisi Normal (<50%)
        sensor_data_records.extend([
            SensorData(zone_id=zones_data[1].id, sensor_type="Ultrasonic", fill_percentage=10.0, value=90.0, created_at=now - timedelta(hours=10)),
            SensorData(zone_id=zones_data[1].id, sensor_type="Ultrasonic", fill_percentage=20.0, value=80.0, created_at=now - timedelta(hours=5)),
            SensorData(zone_id=zones_data[1].id, sensor_type="Ultrasonic", fill_percentage=25.0, value=75.0, created_at=now - timedelta(hours=1)),
        ])

        # Zone 3 (TPS 03 - Palmerah) -> Mengisi bertahap hingga Warning (50% - 80%)
        sensor_data_records.extend([
            SensorData(zone_id=zones_data[2].id, sensor_type="Ultrasonic", fill_percentage=30.0, value=70.0, created_at=now - timedelta(hours=10)),
            SensorData(zone_id=zones_data[2].id, sensor_type="Ultrasonic", fill_percentage=50.0, value=50.0, created_at=now - timedelta(hours=5)),
            SensorData(zone_id=zones_data[2].id, sensor_type="Ultrasonic", fill_percentage=65.0, value=35.0, created_at=now - timedelta(hours=1)),
        ])

        # Zone 4 (TPS 04 - Kemanggisan) -> Stabil di kondisi Normal (<50%)
        sensor_data_records.extend([
            SensorData(zone_id=zones_data[3].id, sensor_type="Ultrasonic", fill_percentage=5.0, value=95.0, created_at=now - timedelta(hours=10)),
            SensorData(zone_id=zones_data[3].id, sensor_type="Ultrasonic", fill_percentage=10.0, value=90.0, created_at=now - timedelta(hours=5)),
            SensorData(zone_id=zones_data[3].id, sensor_type="Ultrasonic", fill_percentage=15.0, value=85.0, created_at=now - timedelta(hours=1)),
        ])

        # Zone 5 (TPS 05 - Kembangan) -> Mengisi bertahap hingga Warning (50% - 80%)
        sensor_data_records.extend([
            SensorData(zone_id=zones_data[4].id, sensor_type="Ultrasonic", fill_percentage=45.0, value=55.0, created_at=now - timedelta(hours=10)),
            SensorData(zone_id=zones_data[4].id, sensor_type="Ultrasonic", fill_percentage=60.0, value=40.0, created_at=now - timedelta(hours=5)),
            SensorData(zone_id=zones_data[4].id, sensor_type="Ultrasonic", fill_percentage=70.0, value=30.0, created_at=now - timedelta(hours=1)),
        ])

        db.add_all(sensor_data_records)
        print("✅ Tabel sensor_data (15 data pembacaan simulasi) berhasil di-seed.")

        # 5. Seed 20 VolumePredictions (Proyeksi 4 Hari ke Depan untuk 5 Wilayah)
        prediction_records = []
        
        # Zone 1
        prediction_records.extend([
            VolumePrediction(zone_id=zones_data[0].id, predicted_volume=90.0, target_time=now + timedelta(days=1), confidence_score=0.95),
            VolumePrediction(zone_id=zones_data[0].id, predicted_volume=95.0, target_time=now + timedelta(days=2), confidence_score=0.90),
            VolumePrediction(zone_id=zones_data[0].id, predicted_volume=100.0, target_time=now + timedelta(days=3), confidence_score=0.85),
            VolumePrediction(zone_id=zones_data[0].id, predicted_volume=105.0, target_time=now + timedelta(days=4), confidence_score=0.80),
        ])

        # Zone 2
        prediction_records.extend([
            VolumePrediction(zone_id=zones_data[1].id, predicted_volume=30.0, target_time=now + timedelta(days=1), confidence_score=0.98),
            VolumePrediction(zone_id=zones_data[1].id, predicted_volume=35.0, target_time=now + timedelta(days=2), confidence_score=0.95),
            VolumePrediction(zone_id=zones_data[1].id, predicted_volume=40.0, target_time=now + timedelta(days=3), confidence_score=0.92),
            VolumePrediction(zone_id=zones_data[1].id, predicted_volume=45.0, target_time=now + timedelta(days=4), confidence_score=0.89),
        ])

        # Zone 3
        prediction_records.extend([
            VolumePrediction(zone_id=zones_data[2].id, predicted_volume=70.0, target_time=now + timedelta(days=1), confidence_score=0.94),
            VolumePrediction(zone_id=zones_data[2].id, predicted_volume=75.0, target_time=now + timedelta(days=2), confidence_score=0.88),
            VolumePrediction(zone_id=zones_data[2].id, predicted_volume=80.0, target_time=now + timedelta(days=3), confidence_score=0.85),
            VolumePrediction(zone_id=zones_data[2].id, predicted_volume=85.0, target_time=now + timedelta(days=4), confidence_score=0.80),
        ])

        # Zone 4
        prediction_records.extend([
            VolumePrediction(zone_id=zones_data[3].id, predicted_volume=20.0, target_time=now + timedelta(days=1), confidence_score=0.97),
            VolumePrediction(zone_id=zones_data[3].id, predicted_volume=25.0, target_time=now + timedelta(days=2), confidence_score=0.94),
            VolumePrediction(zone_id=zones_data[3].id, predicted_volume=30.0, target_time=now + timedelta(days=3), confidence_score=0.90),
            VolumePrediction(zone_id=zones_data[3].id, predicted_volume=35.0, target_time=now + timedelta(days=4), confidence_score=0.85),
        ])

        # Zone 5
        prediction_records.extend([
            VolumePrediction(zone_id=zones_data[4].id, predicted_volume=75.0, target_time=now + timedelta(days=1), confidence_score=0.93),
            VolumePrediction(zone_id=zones_data[4].id, predicted_volume=80.0, target_time=now + timedelta(days=2), confidence_score=0.90),
            VolumePrediction(zone_id=zones_data[4].id, predicted_volume=85.0, target_time=now + timedelta(days=3), confidence_score=0.86),
            VolumePrediction(zone_id=zones_data[4].id, predicted_volume=90.0, target_time=now + timedelta(days=4), confidence_score=0.80),
        ])

        db.add_all(prediction_records)
        print("✅ Tabel volume_predictions (20 data simulasi proyeksi) berhasil di-seed.")

        # 6. Seed CitizenReports (Laporan Pengaduan Warga)
        citizen_reports_data = [
            CitizenReport(
                whatsapp_number="6281234567890",
                report_content="Ada tumpukan sampah plastik menumpuk banyak di dekat gerbang TPS 01 Kebon Jeruk, tolong segera diangkut.",
                zone_id=zones_data[0].id,
                status="Baru",
                is_grouped=True,
                created_at=now - timedelta(hours=4)
            ),
            CitizenReport(
                whatsapp_number="6281298765432",
                report_content="Tolong angkut sampah plastik menumpuk di gerbang TPS 01 Kebon Jeruk, baunya mulai mengganggu.",
                zone_id=zones_data[0].id,
                status="Baru",
                is_grouped=True,
                created_at=now - timedelta(hours=2)
            ),
            CitizenReport(
                whatsapp_number="6281311112222",
                report_content="Laporan bak sampah di TPS Kebon Jeruk jebol pada bagian penahan bawah.",
                zone_id=zones_data[0].id,
                status="Sedang Ditangani",
                is_grouped=False,
                created_at=now - timedelta(days=1)
            ),
            CitizenReport(
                whatsapp_number="6281255556666",
                report_content="Sampah daun kering berserakan di depan TPS 02 Grogol.",
                zone_id=zones_data[1].id,
                status="Selesai",
                is_grouped=False,
                created_at=now - timedelta(days=3)
            ),
            CitizenReport(
                whatsapp_number="6281288889999",
                report_content="Sampah basah menumpuk banyak di TPS Palmerah, baunya menyengat.",
                zone_id=zones_data[2].id,
                status="Baru",
                is_grouped=True,
                created_at=now - timedelta(hours=5)
            ),
            CitizenReport(
                whatsapp_number="6281344445555",
                report_content="Baunya menyengat sekali dari tumpukan sampah basah di TPS Palmerah. Mohon dikirim supir pengangkut.",
                zone_id=zones_data[2].id,
                status="Baru",
                is_grouped=True,
                created_at=now - timedelta(hours=3)
            ),
            CitizenReport(
                whatsapp_number="6281277778888",
                report_content="Warga membuang kasur bekas sembarangan di luar TPS Palmerah.",
                zone_id=zones_data[2].id,
                status="Baru",
                is_grouped=False,
                created_at=now - timedelta(hours=8)
            ),
            CitizenReport(
                whatsapp_number="6281322223333",
                report_content="Ada sampah sisa material bangunan dibuang di depan TPS 04 Kemanggisan.",
                zone_id=zones_data[3].id,
                status="Baru",
                is_grouped=False,
                created_at=now - timedelta(hours=6)
            ),
            CitizenReport(
                whatsapp_number="6281366667777",
                report_content="Tumpukan sampah pasar meluap hingga memakan bahu jalan di TPS 05 Kembangan.",
                zone_id=zones_data[4].id,
                status="Sedang Ditangani",
                is_grouped=False,
                created_at=now - timedelta(hours=14)
            ),
            CitizenReport(
                whatsapp_number="6281211223344",
                report_content="Lampu penerangan di TPS Kembangan mati sejak kemarin malam.",
                zone_id=zones_data[4].id,
                status="Selesai",
                is_grouped=False,
                created_at=now - timedelta(days=2)
            ),
        ]
        db.add_all(citizen_reports_data)
        print("✅ Tabel citizen_reports (10 data aduan warga) berhasil di-seed.")

        # 7. Seed RouteRecommendations (Rekomendasi Rute Supir)
        # Menghasilkan rute terurut optimal berdasarkan tingkat risiko (High Priority -> Warning -> Normal)
        # TPS 01 (1) -> TPS 03 (3) -> TPS 05 (5) -> TPS 02 (2) -> TPS 04 (4)
        tps_ids_ordered = [zones_data[0].id, zones_data[2].id, zones_data[4].id, zones_data[1].id, zones_data[3].id]
        route_recommendation = RouteRecommendation(
            route_json=json.dumps(tps_ids_ordered),
            created_at=now - timedelta(hours=1)
        )
        db.add(route_recommendation)
        print("✅ Tabel route_recommendations (1 rute optimal terurut) berhasil di-seed.")

        db.commit()
        print("🎉 Seeding selesai dengan sukses!")

    except Exception as e:
        db.rollback()
        print(f"❌ Terjadi kesalahan saat seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
