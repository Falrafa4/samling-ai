# 🛠️ Samling AI - Installation & Development Guide

Dokumen ini menyediakan panduan instalasi serta dokumentasi teknis lengkap mengenai perubahan skema database, aturan routing API, tata cara migrasi, dan panduan untuk file dokumentasi pendukung pada proyek **Samling AI**.

---

## 📋 Prasyarat Sistem (Prerequisites)

Sebelum memulai, pastikan sistem Anda sudah terpasang:
- **Node.js** (v18 atau lebih tinggi) & **npm**
- **Python** (v3.10 atau lebih tinggi)
- **pip** (Python package installer)
- **SQLite3** (Driver bawaan Python)

---

## 🖥️ Setup Aplikasi

### A. Frontend Setup
1. Masuk ke direktori frontend:
   ```bash
   cd frontend
   ```
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Jalankan server development:
   ```bash
   npm run dev
   ```
   *Aplikasi frontend akan berjalan di `http://localhost:3000`.*

### B. Backend Setup
1. Masuk ke direktori backend:
   ```bash
   cd backend
   ```
2. Buat dan aktifkan virtual environment Python:
   * **Linux/macOS:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
   * **Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .venv\Scripts\Activate.ps1
     ```
3. Instal paket dependensi:
   ```bash
   pip install -r requirements.txt
   ```
4. Salin file environment:
   ```bash
   cp .env.example .env
   ```
5. Jalankan migrasi database SQLite:
   ```bash
   alembic upgrade head
   ```
6. Jalankan seeder untuk memasukkan data dummy (termasuk user admin dengan password terenkripsi):
   ```bash
   python app/database/seed.py
   ```
7. Jalankan server FastAPI backend:
   ```bash
   uvicorn app.main:app --reload
   ```
   *Backend API akan berjalan di `http://127.0.0.1:8000`. Dokumentasi interaktif Swagger dapat diakses di `http://127.0.0.1:8000/docs`.*

---

## 🗃️ Skema Database & Migrasi (Alembic)

Database proyek ini menggunakan **SQLite** (`samling.db`). Struktur dan migrasi dikelola menggunakan **Alembic**.

### 1. Perubahan Skema & Model Terbaru
Berdasarkan pembaruan ERD proyek, penyesuaian berikut telah diterapkan pada model di `backend/app/models`:
* **Tabel `users` (Baru)**: Ditambahkan untuk menangani autentikasi administrator. Kolom meliputi `id`, `username` (unique), `password` (Secure Bcrypt Hash), dan `role` (Enum `"admin"`).
* **Tabel `zones` (Perbaikan Default)**: Kolom `risk_status` memiliki tipe Enum (`Normal`, `Warning`, `High Priority`). Nilai default telah diperbaiki menjadi `"Normal"` (sebelumnya `"Low"`, yang tidak didefinisikan di dalam opsi enum).
* **Tabel `volume_predictions` (Kolom Baru)**: Ditambahkan kolom `confidence_score` (`Float`) untuk melacak tingkat keyakinan prediksi volume sampah oleh model AI.
* **Tabel `drivers`**: Menyimpan data `name`, `whatsapp_number`, dan `zone_id` (relasi ke wilayah TPS).

### 2. Konfigurasi Migrasi SQLite
Untuk meminimalkan kendala bawaan SQLite yang kurang mendukung DDL dinamis (seperti penghapusan/modifikasi kolom):
* **SQLite Batch Mode**: Opsi `render_as_batch=True` diaktifkan pada `backend/migrations/env.py`. Ini membuat Alembic mensimulasikan alter tabel dengan membuat tabel temporer baru dan memindahkan data secara aman.
* **Dynamic Connection**: Database URL dibaca langsung secara dinamis dari file `.env` proyek menggunakan settings FastAPI.

---

## 🔗 Aturan Routing API (Pencegahan Circular Import)

FastAPI memerlukan struktur registrasi modul yang benar agar tidak terjadi masalah **Circular Import** (impor melingkar) yang dapat menghentikan jalannya server.

### Aturan Utama:
1. **Dilarang mengimpor objek `app` utama** langsung ke dalam sub-modul API (seperti `app/api/zones.py`).
2. Gunakan **`APIRouter`** di setiap modul API:
   ```python
   # Di dalam app/api/zones.py
   from fastapi import APIRouter
   
   router = APIRouter()
   
   @router.get("/zones")
   def get_zones():
       ...
   ```
3. Daftarkan router tersebut di dalam **[app/main.py](file:///home/naufal/Documents/my-projects/samling-ai/backend/app/main.py)** menggunakan `app.include_router()`:
   ```python
   # Di dalam app/main.py
   from app.api import zones
   
   app.include_router(zones.router)
   ```

Pola pemisahan ini memutus dependensi sirkular antara `main.py` dan rute modular Anda.

---

## 🧪 Seeder & Uji Coba Data Dummy

Untuk mempermudah pengujian di lingkungan lokal, proyek menyediakan script seeding di [backend/app/database/seed.py](file:///home/naufal/Documents/my-projects/samling-ai/backend/app/database/seed.py).

### Fitur Seeder:
* **Password Hashing**: Menggunakan algoritma **Bcrypt** native untuk melakukan enkripsi password user admin dummy saat disimpan ke database.
* **Idempotent (Aman Dijalankan Ulang)**: Script akan memeriksa apakah data sudah ada sebelum melakukan insert, menghindari terjadinya error data ganda.
* **Relasi Presisi**: Driver dummy yang dibuat terhubung dengan ForeignKey `zone_id` dari wilayah TPS yang di-seed sebelumnya.

Jalankan perintah ini untuk melakukan seeding data:
```bash
python app/database/seed.py
```

---

## 📂 Penjelasan Dokumen Pendukung (`/docs`)

Berikut adalah berkas dokumentasi teknis pendukung yang berada di folder `docs`:

1. **ERD_SAMLING.md**
   * **Kegunaan**: Berisi dokumentasi skema relasi database (ERD), mendefinisikan seluruh tabel, kolom, tipe data, serta *foreign key constraints* yang valid dalam sistem Samling AI.
2. **DESIGN_SYSTEM_ADMIN_SAMLING.md**
   * **Kegunaan**: Panduan standarisasi visual antarmuka (UI/UX) untuk dashboard Admin. Dokumen ini merincikan grid sistem, tata letak kartu KPI, indikator chart garis prediksi AI, banner peringatan cuaca, serta interaksi state visual.
3. **MIGRATION_CHEATSHEET.md**
   * **Kegunaan**: Lembar contekan praktis untuk pengoperasian Alembic migrations. Berisi sintaks perintah rollback, incremental migration, fresh reset, dan solusi dari error database SQLite yang umum ditemui.

---

## 🤖 Panduan Pengembang AI (AI Development Guidelines)

Bagi tim pengembang AI yang bekerja di dalam direktori `backend/app/ai`:
1. **Virtual Environment**: Selalu pastikan virtual environment `.venv` diaktifkan sebelum menginstal library baru.
2. **Kebijakan Bobot Model (Model Weights)**: **Dilarang keras** men-commit file bobot model berukuran besar (`.pt`, `.bin`, `.safetensors`, `.onnx`) ke dalam repositori Git. Letakkan di folder lokal `backend/app/ai/models/` atau gunakan storage eksternal (HuggingFace/S3).
3. **Detail Integrasi**: Baca petunjuk khusus AI pada berkas lokal `backend/app/ai/README.md`.