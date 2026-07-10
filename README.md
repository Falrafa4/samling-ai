# 🛠️ Samling AI - Smart Waste Management & Forecasting System

**Samling AI** adalah platform manajemen pengangkutan sampah cerdas berbasis Internet of Things (IoT) dan Artificial Intelligence (AI). Sistem ini mengintegrasikan pembacaan data kepenuhan tempat sampah (TPS), peramalan volume sampah di masa depan oleh AI, penampungan laporan keluhan warga melalui WhatsApp Chatbot dengan fitur pengelompokan aduan duplikat, dan optimasi rute navigasi armada pengangkut supir.

---

## 🌟 Fitur Utama (Core Features)

### 🖥️ Dashboard Admin (Frontend Features)
1. **Dasbor Ringkasan Interaktif (Overview Dashboard):**
   * Visualisasi kartu KPI makro (Total Laporan Aktif, TPS Kritis, Rata-rata Kapasitas Sampah) secara riil terhubung ke `/dashboard/summary`.
   * Grafik garis dinamis peramalan volume sampah 7 hari ke depan per wilayah TPS menggunakan Chart.js terintegrasi dengan `/volume-predictions/{zone_id}/projections`.
2. **Peta Spasial Risiko Real-time (Predictive Map):**
   * Pemetaan koordinat geospasial TPS menggunakan Leaflet.js & OpenStreetMap.
   * Penanda lokasi (*marker*) kustom dengan **efek denyut (*pulsing animation*)** berwarna semantik: **Merah** (High Priority), **Kuning** (Warning), **Hijau** (Normal), dan **Abu-abu** (Offline).
   * Laci panel informasi detail TPS terintegrasi dengan sensor kapasitas aktual IoT terbaru (`/sensor-data/latest`) dan driver yang sedang ditugaskan.
3. **Manajemen Penugasan Driver & Rute (Fleet Dispatch):**
   * Pelacak kesiapan driver chatbot (Available, On Duty, Offline) dari endpoint `/drivers`.
   * **Mini-map rute statis Leaflet** untuk memvisualisasikan garis rute pengangkutan optimal secara terurut.
   * Tombol CTA kirim manifes jalan langsung ke WhatsApp supir dengan memicu `/route-recommendations/dispatch/{driver_id}`.
4. **Papan Kanban Laporan Warga (Citizen Reports):**
   * Pengelolaan kartu keluhan warga ke dalam 3 kolom status (Baru, Sedang Ditangani, Selesai) menggunakan **HTML5 Drag-and-Drop Native**.
   * Identifikasi aduan serupa otomatis (*AI Grouped Badge*) untuk menghindari laporan spam.
   * Peninjau foto tumpukan sampah menggunakan modal zoom Lightbox.
   * Pengiriman balasan cepat WhatsApp terintegrasi dengan template draf pesan kustom.
5. **Kelola Wilayah TPS Terproteksi (Zones CRUD):**
   * Panel manajemen penuh data wilayah TPS (Tambah, Sunting, Hapus) menggunakan arsitektur komponen modular (*Separation of Concerns*).
   * Validasi geospasial ketat sisi klien untuk menjamin format koordinat Latitude (-90 s.d 90) & Longitude (-180 s.d 180) valid.

### ⚙️ Layanan Backend & Otomasi (Backend Features)
1. **Autentikasi Terpadu (JWT & Multi-Role)**: Sistem satu akun untuk Admin Dashboard dan Aplikasi Supir (Driver) dengan verifikasi peran ketat.
2. **Integrasi Telemetri IoT (`/api/v1/sensor-data`)**: Menerima data kapasitas sampah dari sensor secara langsung dan memperbarui status risiko TPS secara dinamis.
3. **AI Garbage Forecasting (`/api/v1/volume-predictions`)**: Menyimpan data ramalan volume sampah masa depan dan menampilkan proyeksi tren 7 hari ke depan.
4. **WhatsApp Chatbot Webhook & Grouping Aduan (`/api/v1/webhook/whatsapp`)**: Menyimpan pesan pengaduan warga. Jika terdapat pesan serupa di zona yang sama dalam 12 jam terakhir (kemiripan teks $> 60\%$), aduan otomatis dikelompokkan (*grouped*) untuk menghindari *spamming*.
5. **Optimasi Rute & Dispatch Supir (`/api/v1/route-recommendations`)**: Menugaskan manifes rute TPS optimal kepada supir, menyimulasikan pesan WhatsApp berisi daftar TPS terurut, menyusun URL navigasi multi-stop Google Maps, dan memantau status penyelesaian tugas driver.

---

## 💻 Tech Stack & Kebutuhan Sistem

### Tech Stack
* **Frontend**: React.js 19, Vite, Tailwind CSS v4, Leaflet.js, Chart.js, React-Use Hooks
* **Backend**: FastAPI (Python), SQLAlchemy ORM, Alembic Migrations
* **Database**: SQLite (`samling.db`)
* **Utilitas**: Bcrypt (Password Hashing), PyJWT (Token JWT), Difflib (Text Similarity)

### Kebutuhan Sistem (Prerequisites)
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
1. Masuk ke direktori backend:
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
4. Buat berkas environment lokal dari contoh `.env.example`:
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
   python app/database/seed_historical_waste_data.py
   ```
7. Jalankan server FastAPI secara lokal:
   ```bash
   uvicorn app.main:app --reload
   ```
   * Server backend Anda akan berjalan di `http://127.0.0.1:8000`.
   * Akses dokumentasi interaktif Swagger API di `http://127.0.0.1:8000/docs`.

### 3. Setup Frontend (React + Vite)
1. Buka terminal baru dan masuk ke direktori frontend:
   ```bash
   cd ../frontend
   ```
2. Buat berkas environment lokal dari contoh `.env.example`:
   ```bash
   cp .env.example .env
   ```
   * *Catatan:* Anda dapat menyesuaikan nama aplikasi (`VITE_APP_NAME`) dan URL API backend (`VITE_BASE_API_URL`) di dalam file `.env` yang baru dibuat.
3. Pasang modul dependensi:
   ```bash
   npm install
   ```
4. Jalankan server development React:
   ```bash
   npm run dev
   ```
   * Aplikasi frontend Anda akan berjalan di `http://localhost:3000` (atau port dinamis yang ditampilkan di terminal).

---

## ⚠️ Panduan Pemecahan Masalah (Troubleshooting)

| Masalah | Penyebab Utama | Solusi Solutif |
| :--- | :--- | :--- |
| **`OperationalError: no such table`** atau **`NOT NULL constraint failed`** | Skema database SQLite lokal tidak sinkron atau kotor karena sisa-sisa entitas lama. | Reset database dan seed ulang dari awal dengan menjalankan:<br>`rm -f samling.db && alembic upgrade head && python app/database/seed.py` |
| **`InsecureKeyLengthWarning` pada JWT** | String `SECRET_KEY` di file `.env` kurang dari 32 karakter (256-bit). | Ubah nilai `SECRET_KEY` di file `.env` backend Anda dengan kunci rahasia yang lebih panjang dan aman. |
| **CORS Policy Block** | Frontend berjalan pada port yang tidak diizinkan oleh konfigurasi CORS backend. | Pastikan URL frontend Anda terdaftar di dalam list origin yang diperbolehkan pada berkas `backend/app/main.py`. |
| **Eror `401 Unauthorized` di Dashboard** | Token di header `Authorization: Bearer` memiliki kutip ganda akibat serialisasi otomatis JSON. | Pastikan kode parsing token di `api.js` membersihkan JWT dengan `JSON.parse` jika data dibaca dari react-use. |

---

## 📄 Dokumentasi Tambahan
* **[API_SPEC.md](API_SPEC.md)**: Daftar spesifikasi lengkap payload request dan response untuk mempermudah integrasi pengembang frontend dan tim chatbot.