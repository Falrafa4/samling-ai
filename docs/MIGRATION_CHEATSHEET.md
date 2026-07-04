# 📑 Alembic Migration Cheatsheet (SQLAlchemy & FastAPI)

Cheatsheet ini berisi panduan lengkap untuk menggunakan **Alembic** sebagai alat migrasi database di proyek Python/FastAPI, khususnya dengan integrasi **SQLite**.

---

## 🚀 1. Inisialisasi & Setup Awal

Jika proyek belum memiliki Alembic, ikuti langkah-langkah di bawah untuk setup dari awal:

### Install Alembic
Pastikan library sudah terinstall di dalam virtual environment Anda:
```bash
pip install alembic
```

### Inisialisasi Folder Migrasi
Inisialisasi direktori `migrations` di root proyek:
```bash
alembic init migrations
```
Perintah ini akan menghasilkan:
* `alembic.ini` (file konfigurasi utama Alembic)
* `migrations/` (direktori yang berisi script environment dan folder versi migrasi)

---

## ⚙️ 2. Konfigurasi Penting (Best Practices)

### A. Integrasi dengan `.env` FastAPI secara Dinamis
Bandingkan dengan melakukan *hardcode* database URL di `alembic.ini`, lebih disarankan untuk membacanya dinamis dari environment variabel atau pengaturan aplikasi.

Edit file [migrations/env.py](file:///home/naufal/Documents/my-projects/samling-ai/backend/migrations/env.py):
```python
# Import settings proyek Anda
from app.core.config import settings

# Override config url menggunakan database url dari config aplikasi
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
```

### B. Mendaftarkan Model (Autogenerate Support)
Agar Alembic mendeteksi perubahan model secara otomatis, pastikan metadata model didaftarkan ke `target_metadata` di [migrations/env.py](file:///home/naufal/Documents/my-projects/samling-ai/backend/migrations/env.py):
```python
from app.database.database import Base
# Import semua model yang ada agar terdaftar ke metadata Base
from app.models.zones import Zone
from app.models.citizen_reports import CitizenReport
from app.models.drivers import Driver
from app.models.sensor_data import SensorData
from app.models.volume_predictions import VolumePrediction
from app.models.route_recommendations import RouteRecommendation

# Pasang metadata ke target
target_metadata = Base.metadata
```

### C. Mengaktifkan Batch Mode untuk SQLite
SQLite tidak mendukung operasi perubahan kolom (seperti `DROP COLUMN`, `ALTER COLUMN`). Tambahkan `render_as_batch=True` di [migrations/env.py](file:///home/naufal/Documents/my-projects/samling-ai/backend/migrations/env.py):
```python
# Pada run_migrations_offline():
context.configure(
    url=url,
    target_metadata=target_metadata,
    literal_binds=True,
    dialect_opts={"paramstyle": "named"},
    render_as_batch=True,  # <-- Tambahkan ini
)

# Pada run_migrations_online():
context.configure(
    connection=connection,
    target_metadata=target_metadata,
    render_as_batch=True,  # <-- Tambahkan ini
)
```

---

## 💻 3. Perintah Utama (Core Commands)

Jalankan perintah ini menggunakan CLI python dari virtual environment Anda (misal `.venv/bin/alembic ...`):

| Perintah | Deskripsi |
| :--- | :--- |
| `alembic revision --autogenerate -m "pesan"` | Membuat file revisi migrasi baru berdasarkan perubahan pada model. |
| `alembic upgrade head` | Menjalankan semua migrasi yang belum diterapkan hingga versi terbaru (`head`). |
| `alembic downgrade -1` | Membatalkan satu migrasi terakhir (rollback satu langkah). |
| `alembic downgrade base` | Mengembalikan database ke keadaan kosong sebelum migrasi apa pun diterapkan. |
| `alembic current` | Menampilkan versi migrasi yang aktif saat ini pada database. |
| `alembic history --verbose` | Menampilkan riwayat/kronologi file revisi migrasi yang sudah pernah dibuat. |

---

## 🛠️ 4. Skenario Penggunaan Praktis

### Skenario A: Melakukan Perubahan Kolom Baru (Incremental)
Gunakan opsi ini jika Anda ingin menambahkan kolom baru **tanpa menghapus data yang sudah ada** di database:
1. Edit file model Anda di `app/models/` (misal menambah kolom `phone_number`).
2. Jalankan perintah auto-generate:
   ```bash
   alembic revision --autogenerate -m "add_phone_number_to_drivers"
   ```
3. Cek file baru yang terbuat di `migrations/versions/` untuk memastikan perubahan sudah benar.
4. Terapkan perubahan ke database:
   ```bash
   alembic upgrade head
   ```

### Skenario B: Reset Total Migrasi dari Awal (Fresh Migrate)
Gunakan opsi ini selama fase **development** jika Anda ingin membersihkan seluruh tabel, menghapus histori migrasi yang menumpuk, dan membuat satu file inisiasi bersih:
1. Hapus file database SQLite Anda:
   ```bash
   rm -f samling.db
   ```
2. Hapus semua file migrasi versi lama di folder `versions/`:
   ```bash
   rm -f migrations/versions/*.py
   ```
3. Generate revisi migrasi baru dari awal:
   ```bash
   alembic revision --autogenerate -m "initial_migration_fresh"
   ```
4. Jalankan migrasi ke database yang baru:
   ```bash
   alembic upgrade head
   ```

---

## ⚠️ 5. Troubleshooting (Penyelesaian Masalah)

### 🔴 Error: `ValueError: OperationalError ... Table already exists`
* **Penyebab**: Database Anda sudah memiliki tabel-tabel tersebut sebelum Alembic diinisialisasi atau histori migrasi di database tidak sinkron dengan file di folder `versions`.
* **Solusi**: 
  Jika di fase development, lakukan **Skenario B (Fresh Migrate)**. Jika di production, Anda perlu melakukan *stamp* versi database ke revisi tertentu menggunakan perintah:
  ```bash
  alembic stamp head
  ```
  *(Perintah ini menandai database Anda sudah berada di versi ter-update tanpa menjalankan query pembuatan tabel).*

### 🔴 Error: `ModuleNotFoundError: No module named 'app'`
* **Penyebab**: Python tidak bisa menemukan folder root aplikasi Anda saat menjalankan script `alembic`.
* **Solusi**: Tambahkan path saat ini sebelum menjalankan alembic atau pastikan `prepend_sys_path = .` aktif di `alembic.ini`. Alternatifnya, jalankan menggunakan command line python:
  ```bash
  PYTHONPATH=. .venv/bin/alembic upgrade head
  ```

### 🔴 Error: `sqlite3.OperationalError: near "DROP": syntax error`
* **Penyebab**: Anda menghapus atau memodifikasi kolom di database SQLite tanpa mengaktifkan Batch Mode.
* **Solusi**: Pastikan Anda sudah mengonfigurasi `render_as_batch=True` di `migrations/env.py` (Lihat bagian **2.C**).
