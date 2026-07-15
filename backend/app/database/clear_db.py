import os
import sys
from app.core.config import settings

def main():
    url = settings.DATABASE_URL
    print(f"Membersihkan database... URL: {url}")
    if url.startswith("sqlite"):
        # SQLite: Hapus file database fisik
        if url.startswith("sqlite:///"):
            db_path = url.replace("sqlite:///", "")
        else:
            db_path = url.replace("sqlite://", "")
            
        if db_path and db_path != ":memory:":
            db_path = os.path.abspath(db_path)
            if os.path.exists(db_path):
                try:
                    os.remove(db_path)
                    print(f"✅ File database SQLite berhasil dihapus: {db_path}")
                except Exception as e:
                    print(f"⚠️ Gagal menghapus file database SQLite: {e}")
            else:
                print(f"ℹ️ File database SQLite tidak ditemukan pada path: {db_path}")
            
            # Hapus juga file jurnal wal/shm jika ada
            for suffix in ["-journal", "-wal", "-shm"]:
                extra_path = db_path + suffix
                if os.path.exists(extra_path):
                    try:
                        os.remove(extra_path)
                        print(f"✅ File tambahan SQLite dihapus: {extra_path}")
                    except Exception as e:
                        print(f"⚠️ Gagal menghapus {extra_path}: {e}")
    else:
        # Non-SQLite: Gunakan SQLAlchemy untuk men-drop seluruh tabel
        try:
            from sqlalchemy import MetaData
            from app.database.database import engine
            
            metadata = MetaData()
            metadata.reflect(bind=engine)
            metadata.drop_all(bind=engine)
            print("✅ Seluruh tabel database non-SQLite berhasil di-drop.")
        except Exception as e:
            print(f"⚠️ Gagal men-drop tabel database: {e}")

if __name__ == "__main__":
    main()
