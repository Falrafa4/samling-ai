# 🛠️ Samling AI - Smart Waste Management & Forecasting System

**Samling AI** adalah platform manajemen pengangkutan sampah cerdas berbasis Internet of Things (IoT) dan Artificial Intelligence (AI). Sistem ini mengintegrasikan pembacaan data kepenuhan tempat sampah (TPS), peramalan volume sampah di masa depan oleh AI (**Amadeus**), penampungan laporan keluhan warga melalui WhatsApp Chatbot (**Agung**) dengan fitur pengelompokan aduan duplikat, dan optimasi rute navigasi armada pengangkut supir.

---

## 🌟 Fitur Utama (Core Features)

1. **Autentikasi Terpadu (JWT & Multi-Role)**: Sistem satu akun untuk Admin Dashboard dan Aplikasi Supir (Driver) dengan verifikasi peran ketat.
2. **Integrasi Telemetri IoT (`/api/v1/sensor-data`)**: Menerima data kapasitas sampah dari sensor secara langsung dan memperbarui status risiko TPS secara dinamis.
3. **AI Garbage Forecasting (`/api/v1/volume-predictions`)**: Menyimpan data ramalan volume sampah masa depan dan menampilkan proyeksi tren 7 hari ke depan.
4. **WhatsApp Chatbot Webhook & Grouping Aduan (`/api/v1/webhook/whatsapp`)**: Menyimpan pesan pengaduan warga. Jika terdapat pesan serupa di zona yang sama dalam 12 jam terakhir (kemiripan teks $> 60\%$), aduan otomatis dikelompokkan (*grouped*) untuk menghindari *spamming*.
5. **Optimasi Rute & Dispatch Supir (`/api/v1/route-recommendations`)**: Menugaskan manifes rute TPS optimal kepada supir, menyimulasikan pesan WhatsApp berisi daftar TPS terurut, menyusun URL navigasi multi-stop Google Maps, dan memantau status penyelesaian tugas driver.
6. **Dasbor Ringkasan Admin (`/api/v1/dashboard/summary`)**: Agregasi metrik makro (TPS bahaya, rata-rata kapasitas, total laporan) yang cepat dimuat untuk visualisasi UI React.

---

## 💻 Tech Stack & Kebutuhan Sistem

### Tech Stack
* **Frontend**: React.js, Vite, Tailwind CSS, Leaflet.js
* **Backend**: FastAPI (Python), SQLAlchemy ORM, Alembic Migrations
* **Database**: SQLite (`samling.db`)
* **Utilitas**: Bcrypt (Password Hashing), PyJWT (Token JWT), Difflib (Text Similarity)

### Prasyarat Instalasi (Prerequisites)
Pastikan perangkat lokal Anda telah terpasang:
* **Node.js** (v18 atau lebih tinggi) & **npm**
* **Python** (v3.10 atau lebih tinggi)
* **pip** (Python Package Installer)
* **SQLite3**

---

## 🚀 Panduan Instalasi Lokal (Setup Guide)

### 1. Klon Repositori & Masuk Proyek
```bash
git clone <repo-url>
cd samling-ai
```

### 2. Setup Backend (FastAPI)
1. Pindah ke direktori backend:
   ```bash
   cd backend
   ```
2. Buat dan aktifkan Virtual Environment Python:
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
3. Pasang dependensi python:
   ```bash
   pip install -r requirements.txt
   ```
4. Buat berkas environment lokal dari contoh:
   ```bash
   cp .env.example .env
   ```
5. Jalankan migrasi database Alembic untuk membuat struktur tabel:
   ```bash
   alembic upgrade head
   ```
6. Jalankan script seeder untuk memasukkan data awal (wilayah TPS, supir, admin, sensor, volume, dll.):
   ```bash
   python app/database/seed.py
   ```
7. Jalankan server FastAPI secara lokal:
   ```bash
   uvicorn app.main:app --reload
   ```
   * Server backend Anda akan berjalan di `http://127.0.0.1:8000`.
   * Akses dokumentasi interaktif Swagger API di `http://127.0.0.1:8000/docs`.

### 3. Setup Frontend (React + Vite)
1. Pindah ke direktori frontend:
   ```bash
   cd ../frontend
   ```
2. Pasang modul dependensi:
   ```bash
   npm install
   ```
3. Jalankan server development React:
   ```bash
   npm run dev
   ```
   * Aplikasi frontend Anda akan berjalan di `http://localhost:3000`.

---

## 🧪 Rangkaian Pengujian Integrasi (Testing)

Untuk memastikan bahwa seluruh endpoint API, aturan *routing*, validasi Pydantic, dan koneksi database SQLite berjalan normal setelah modifikasi skema, Anda dapat menjalankan rangkaian uji otomatis yang berada di folder *scratch*:

1. **Uji Coba Sensor IoT & Status Wilayah**:
   ```bash
   .venv/bin/python scratch/test_endpoints.py
   ```
2. **Uji Coba AI Volume Predictions & Proyeksi 7 Hari**:
   ```bash
   .venv/bin/python scratch/test_predictions.py
   ```
3. **Uji Coba Pengaduan Warga & Grouping Aduan Duplikat**:
   ```bash
   .venv/bin/python scratch/test_reports.py
   ```
4. **Uji Coba Rekomendasi Rute & Dispatch WA**:
   ```bash
   .venv/bin/python scratch/test_routes.py
   ```
5. **Uji Coba Endpoint Tambahan (Dashboard/Auth/Webhook)**:
   ```bash
   .venv/bin/python scratch/test_new_endpoints.py
   ```

---

## ⚠️ Panduan Pemecahan Masalah (Troubleshooting)

| Masalah | Penyebab Utama | Solusi Solutif |
| :--- | :--- | :--- |
| **`OperationalError: no such table`** atau **`NOT NULL constraint failed`** | Skema database SQLite lokal tidak sinkron atau kotor karena sisa-sisa entitas lama. | Reset database dan seed ulang dari awal dengan menjalankan perintah:<br>`rm -f samling.db && alembic upgrade head && python app/database/seed.py` |
| **`InsecureKeyLengthWarning` pada JWT** | String `SECRET_KEY` di file `.env` kurang dari 32 karakter (256-bit). | Ubah nilai `SECRET_KEY` di file `.env` Anda dengan kunci rahasia yang lebih panjang dan aman. |
| **`Circular Import Error` saat startup** | Melakukan impor silang melingkar antar modul (misal mengimpor objek `app` ke dalam sub-router). | Pastikan sub-router hanya menggunakan `APIRouter()` dan daftarkan mereka secara eksklusif di `main.py` menggunakan `app.include_router()`. |
| **CORS Policy Block** | Frontend berjalan pada port yang tidak diizinkan oleh konfigurasi CORS backend. | Pastikan port frontend Anda sesuai dengan daftar origin yang diperbolehkan di dalam berkas `backend/app/main.py`. |

---

## 📄 Dokumentasi Tambahan
* **API_SPEC.md**: Daftar spesifikasi lengkap payload request dan response untuk mempermudah integrasi pengembang frontend dan tim chatbot.