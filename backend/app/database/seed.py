import sys
import os

# Menambahkan root directory proyek ke sys.path agar module app dapat ditemukan
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.database.database import SessionLocal, engine
from app.models.users import User
from app.models.zones import Zone
from app.models.drivers import Driver

# Anda bisa menggunakan passlib untuk hashing password admin jika sudah ada helper authnya
# Untuk sementara, ini di-seed dengan text biasa atau placeholder hash
def seed_data():
    db = SessionLocal()
    try:
        print("🌱 Memulai proses seeding data dummy...")

        # 1. Seed Users (Admin)
        if db.query(User).count() == 0:
            admin_user = User(
                username="admin_samling",
                password="supersecurepassword",  # Sebaiknya di-hash di real application
                role="admin"
            )
            db.add(admin_user)
            print("✅ User admin berhasil di-seed.")
        else:
            print("⚠️ Tabel users sudah memiliki data, skip seeding users.")

        # 2. Seed Zones (Wilayah TPS)
        if db.query(Zone).count() == 0:
            zones_data = [
                Zone(name="TPS 01 - Kebon Jeruk", latitude=-6.1944, longitude=106.7672, risk_status="Normal"),
                Zone(name="TPS 02 - Grogol", latitude=-6.1566, longitude=106.7892, risk_status="Warning"),
                Zone(name="TPS 03 - Palmerah", latitude=-6.2084, longitude=106.7992, risk_status="High Priority"),
            ]
            db.add_all(zones_data)
            db.commit()  # Commit agar zone_id didapatkan untuk FK driver
            print("✅ Tabel zones (TPS) berhasil di-seed.")
        else:
            print("⚠️ Tabel zones sudah memiliki data, skip seeding zones.")

        # 3. Seed Drivers
        if db.query(Driver).count() == 0:
            # Mengambil zone_id yang baru saja di-seed
            first_zone = db.query(Zone).filter_by(name="TPS 01 - Kebon Jeruk").first()
            second_zone = db.query(Zone).filter_by(name="TPS 02 - Grogol").first()

            if first_zone and second_zone:
                drivers_data = [
                    Driver(name="Budi Utomo", whatsapp_number="6281234567890", zone_id=first_zone.id),
                    Driver(name="Joko Susilo", whatsapp_number="6281298765432", zone_id=second_zone.id),
                ]
                db.add_all(drivers_data)
                print("✅ Tabel drivers berhasil di-seed.")
        else:
            print("⚠️ Tabel drivers sudah memiliki data, skip seeding drivers.")

        db.commit()
        print("🎉 Seeding selesai dengan sukses!")

    except Exception as e:
        db.rollback()
        print(f"❌ Terjadi kesalahan saat seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
