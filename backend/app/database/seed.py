import sys
import os
from datetime import datetime, timedelta, timezone
from app.utils.timezone import get_jakarta_now
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
JSON_PATH = os.path.join(DATA_DIR, "tps_silika_full.json")


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
        fleet_options = [
            db.query(Fleet).filter(Fleet.name == "Dump Truck Besar").first(),
            db.query(Fleet).filter(Fleet.name == "Arm Roll Besar").first(),
            db.query(Fleet).filter(Fleet.name == "Truk Compactor RDF").first(),
            db.query(Fleet).filter(Fleet.name == "Arm Roll Kecil").first(),
            db.query(Fleet).filter(Fleet.name == "Truk Tronton").first(),
        ]

        # 4. Seed Drivers (5 driver untuk setiap wilayah administrasi DKI Jakarta)
        driver_seed_by_area = {
            "Jakarta Pusat": [
                ("Budi Utomo", "budi_pusat", "6281234567890"),
                ("Dedi Kurniawan", "dedi_pusat", "6281234567891"),
                ("Eko Prasetyo", "eko_pusat", "6281234567892"),
                ("Fajar Nugroho", "fajar_pusat", "6281234567893"),
                ("Gilang Maulana", "gilang_pusat", "6281234567894"),
            ],
            "Jakarta Barat": [
                ("Joko Susilo", "joko_barat", "6281298765430"),
                ("Hendra Saputra", "hendra_barat", "6281298765431"),
                ("Irfan Hakim", "irfan_barat", "6281298765432"),
                ("Kurnia Ramadhan", "kurnia_barat", "6281298765433"),
                ("Lukman Santoso", "lukman_barat", "6281298765434"),
            ],
            "Jakarta Selatan": [
                ("Agus Saputra", "agus_selatan", "6281311223340"),
                ("Maman Suryaman", "maman_selatan", "6281311223341"),
                ("Nanda Pratama", "nanda_selatan", "6281311223342"),
                ("Oki Firmansyah", "oki_selatan", "6281311223343"),
                ("Pandu Wijaya", "pandu_selatan", "6281311223344"),
            ],
            "Jakarta Timur": [
                ("Herman Wijaya", "herman_timur", "6281355667780"),
                ("Qomar Hidayat", "qomar_timur", "6281355667781"),
                ("Rizky Febrian", "rizky_timur", "6281355667782"),
                ("Sandi Permana", "sandi_timur", "6281355667783"),
                ("Teguh Wibowo", "teguh_timur", "6281355667784"),
            ],
            "Jakarta Utara": [
                ("Rudy Hermawan", "rudy_utara", "6281288990010"),
                ("Umar Faruq", "umar_utara", "6281288990011"),
                ("Vicky Setiawan", "vicky_utara", "6281288990012"),
                ("Wahyu Saputra", "wahyu_utara", "6281288990013"),
                ("Yusuf Maulana", "yusuf_utara", "6281288990014"),
            ],
            "Kepulauan Seribu": [
                ("Arif Rahman", "arif_seribu", "6281377008800"),
                ("Bambang Satria", "bambang_seribu", "6281377008801"),
                ("Chandra Putra", "chandra_seribu", "6281377008802"),
                ("Darmawan Saleh", "darmawan_seribu", "6281377008803"),
                ("Endra Kusuma", "endra_seribu", "6281377008804"),
            ],
        }

        drivers_data = []
        for area, driver_profiles in driver_seed_by_area.items():
            for index, (name, username, whatsapp_number) in enumerate(driver_profiles):
                fleet = fleet_options[index % len(fleet_options)]
                drivers_data.append(
                    User(
                        name=name,
                        username=username,
                        password=get_password_hash("driver123"),
                        role="driver",
                        whatsapp_number=whatsapp_number,
                        fleet_id=fleet.id if fleet else None,
                        status="Offline",
                        coverage_area=area,
                    )
                )

        db.add_all(drivers_data)
        db.commit()
        print(f"Tabel users ({len(drivers_data)} driver ber-armada, 5 driver per wilayah DKI Jakarta) berhasil di-seed.")

        # 5. Seed SensorData - SKIPPED
        # Data sensor kini di-seed oleh script terpisah: seed_sensor_data.py
        # Script tersebut akan membuat data simulasi 7 hari untuk ~10% TPS dengan distribusi status realistis
        print("Tabel sensor_data akan di-seed oleh script terpisah (seed_sensor_data.py).")

        # 6. Seed VolumePredictions
        zone1 = zone_sample[0]
        zone2 = zone_sample[1]
        zone3 = zone_sample[2]
        zone4 = zone_sample[3]
        zone5 = zone_sample[4]

        prediction_records = [
            VolumePrediction(tps_id=zone1.id, kecamatan=zone1.kecamatan, predicted_volume_percentage=90.0, prediction_status="Awas", priority_rank=1, forecast_batch_id="batch_seed", model_version="1.0"),
            VolumePrediction(tps_id=zone2.id, kecamatan=zone2.kecamatan, predicted_volume_percentage=35.0, prediction_status="Aman", priority_rank=5, forecast_batch_id="batch_seed", model_version="1.0"),
            VolumePrediction(tps_id=zone3.id, kecamatan=zone3.kecamatan, predicted_volume_percentage=80.0, prediction_status="Waspada", priority_rank=2, forecast_batch_id="batch_seed", model_version="1.0"),
            VolumePrediction(tps_id=zone4.id, kecamatan=zone4.kecamatan, predicted_volume_percentage=30.0, prediction_status="Aman", priority_rank=4, forecast_batch_id="batch_seed", model_version="1.0"),
            VolumePrediction(tps_id=zone5.id, kecamatan=zone5.kecamatan, predicted_volume_percentage=75.0, prediction_status="Waspada", priority_rank=3, forecast_batch_id="batch_seed", model_version="1.0"),
        ]

        db.add_all(prediction_records)
        print("Tabel volume_predictions (5 data proyeksi) berhasil di-seed.")

        # 7. Seed CitizenReports
        now = get_jakarta_now()
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
                report_content="Akan diadakan kerja bakti pembersihan lingkungan warga sekitar area TPS hari Minggu ini.",
                zone_id=zone1.id,
                status="Sedang Ditangani",
                is_grouped=False,
                image_path=None,
                type="event",
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
                report_content="Akan ada acara festival kuliner jajanan tradisional di sekitar area TPS mulai besok pagi.",
                zone_id=zone5.id,
                status="Selesai",
                is_grouped=False,
                image_path="uploads/placeholder.avif",
                type="event",
                created_at=now - timedelta(days=2)
            ),
        ]
        db.add_all(citizen_reports_data)
        db.commit()

        # 8. Seed RouteRecommendations via AI Scheduler
        # from app.ai.scheduler.route_scheduler import generate_routes
        # generate_routes(db)
        # print("Tabel route_recommendations (rute dinamis AI) berhasil di-seed.")

        db.commit()
        print("Seeding selesai dengan sukses!")

    except Exception as e:
        db.rollback()
        print(f"Terjadi kesalahan saat seeding: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
