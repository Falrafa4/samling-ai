import sys
import os
from datetime import datetime, timedelta, timezone

# Menambahkan root directory proyek ke sys.path agar module app dapat ditemukan
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.database.database import SessionLocal, engine
from app.models.users import User
from app.models.zones import Zone
from app.models.drivers import Driver
from app.models.sensor_data import SensorData
from app.utils.security import get_password_hash

def seed_data():
    db = SessionLocal()
    try:
        print("🌱 Memulai proses seeding data dummy...")

        # Bersihkan data lama agar seeder selalu fresh dan tidak memicu constraint/duplikasi
        db.query(Driver).delete()
        db.query(SensorData).delete()
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
        # Status risiko awal diselaraskan dengan telemetri terakhir yang akan di-seed
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
        # Menghasilkan 3 pembacaan historis per zona (total 15 data)
        now = datetime.now(timezone.utc)
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

        db.commit()
        print("🎉 Seeding selesai dengan sukses!")

    except Exception as e:
        db.rollback()
        print(f"❌ Terjadi kesalahan saat seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
