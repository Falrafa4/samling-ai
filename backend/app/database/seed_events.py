import sys
import os
from datetime import date

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.database.database import SessionLocal
from app.models.events import Event

def seed_events():
    db = SessionLocal()
    try:
        print("Memulai proses seeding tabel events...")
        
        # Bersihkan data event lama
        db.query(Event).delete()
        db.commit()
        print("Data event lama berhasil dibersihkan.")

        # Data event tahunan Jakarta
        events_data = [
            Event(
                name="Pekan Raya Jakarta (PRJ) / Jakarta Fair",
                start_date=date(2026, 6, 12),
                end_date=date(2026, 7, 14),
                location="JIExpo Kemayoran",
                wilayah="Jakarta Pusat",
                kecamatan="Kemayoran",
                urgency_score=0.95,
                description="Pameran perdagangan, panggung musik hiburan, dan kuliner terlama dan terbesar se-Asia Tenggara dalam rangka HUT DKI Jakarta."
            ),
            Event(
                name="Java Jazz Festival",
                start_date=date(2026, 5, 24),
                end_date=date(2026, 5, 26),
                location="JIExpo Kemayoran",
                wilayah="Jakarta Pusat",
                kecamatan="Kemayoran",
                urgency_score=0.80,
                description="Festival musik jazz internasional tahunan yang mendatangkan berbagai musisi jazz lokal maupun mancanegara."
            ),
            Event(
                name="We The Fest (WTF)",
                start_date=date(2026, 7, 19),
                end_date=date(2026, 7, 21),
                location="Gelora Bung Karno (GBK)",
                wilayah="Jakarta Pusat",
                kecamatan="Tanah Abang",
                urgency_score=0.85,
                description="Festival seni, mode, makanan, dan musik multi-genre tahunan yang populer di kalangan anak muda Jakarta."
            ),
            Event(
                name="Perayaan HUT DKI Jakarta di Monas",
                start_date=date(2026, 6, 22),
                end_date=date(2026, 6, 23),
                location="Silang Monas",
                wilayah="Jakarta Pusat",
                kecamatan="Gambir",
                urgency_score=0.85,
                description="Acara panggung hiburan rakyat, pawai budaya, dan pesta kembang api memperingati hari jadi kota Jakarta."
            ),
            Event(
                name="Jakarta Night Festival (Malam Tahun Baru)",
                start_date=date(2026, 12, 31),
                end_date=date(2027, 1, 1),
                location="Sudirman-Thamrin",
                wilayah="Jakarta Pusat",
                kecamatan="Menteng",
                urgency_score=0.95,
                description="Festival panggung hiburan musik di sepanjang jalan Sudirman-Thamrin serta hitung mundur malam pergantian tahun."
            ),
            Event(
                name="Djakarta Warehouse Project (DWP)",
                start_date=date(2026, 12, 11),
                end_date=date(2026, 12, 13),
                location="JIExpo Kemayoran",
                wilayah="Jakarta Pusat",
                kecamatan="Kemayoran",
                urgency_score=0.85,
                description="Festival musik dansa elektronik (EDM) tahunan terbesar di Asia Tenggara."
            ),
            Event(
                name="Perayaan Idul Fitri 1447 H (Libur Nasional & Cuti Bersama)",
                start_date=date(2026, 3, 20),
                end_date=date(2026, 3, 24),
                location="Masjid Istiqlal & Seluruh Wilayah",
                wilayah="Jakarta Pusat",
                kecamatan="Sawah Besar",
                urgency_score=0.95,
                description="Libur perayaan Idul Fitri dan cuti bersama. Memicu peningkatan tajam volume sampah rumah tangga, sisa konsumsi, serta keramaian di area pusat ibadah utama."
            ),
            Event(
                name="Perayaan Idul Adha 1447 H (Pemotongan Hewan Kurban)",
                start_date=date(2026, 5, 27),
                end_date=date(2026, 5, 28),
                location="Masjid Istiqlal & Seluruh Wilayah",
                wilayah="Jakarta Pusat",
                kecamatan="Sawah Besar",
                urgency_score=0.90,
                description="Hari Raya Idul Adha dan hari tasyrik. Terjadi peningkatan sampah organik sisa pemotongan hewan kurban di berbagai wilayah."
            ),
            Event(
                name="Peringatan Hari Kemerdekaan RI ke-81",
                start_date=date(2026, 8, 17),
                end_date=date(2026, 8, 17),
                location="Istana Merdeka & Silang Monas",
                wilayah="Jakarta Pusat",
                kecamatan="Gambir",
                urgency_score=0.85,
                description="Upacara bendera dan berbagai pesta rakyat kemerdekaan yang dirayakan serentak oleh warga di penjuru kota."
            )
        ]

        db.add_all(events_data)
        db.commit()
        print(f"Tabel events ({len(events_data)} event) berhasil di-seed.")
        print("Seeding events selesai dengan sukses!")
        
    except Exception as e:
        db.rollback()
        print(f"Terjadi kesalahan saat seeding events: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_events()
