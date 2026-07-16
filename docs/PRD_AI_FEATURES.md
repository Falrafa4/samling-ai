# Product Requirement Document (PRD)
## Pengembangan Fitur AI & Kebersihan Pintar pada Proyek Samling AI

**Peran:** Senior Product Manager  
**Status Dokumen:** Approved (Draft Final)  
**Versi:** 1.0.0  
**Tanggal:** 16 Juli 2026  
**Penulis:** Sekawan Engineers (Senior PM Team)  

---

## 📖 1. Latar Belakang & Tujuan Bisnis

### 1.1 Deskripsi Masalah
Sistem manajemen sampah perkotaan konvensional bersifat reaktif. Pengumpulan sampah hanya dilakukan berdasarkan jadwal tetap tanpa memperhitungkan fluktuasi volume sampah harian. Hal ini menyebabkan terjadinya penumpukan sampah yang terlambat ditangani, terutama saat cuaca ekstrem (hujan lebat), hari libur nasional, atau acara publik skala besar (seperti PRJ). Di sisi lain, armada dinas kebersihan seringkali beroperasi secara tidak efisien, melewati rute yang sama tanpa memprioritaskan TPS kritis yang hampir penuh.

### 1.2 Visi Produk: Samling AI
**Samling AI** hadir sebagai sistem manajemen sampah proaktif berbasis AI dan telemetri IoT. Dengan memadukan data dari sensor IoT di lapangan, pengaduan warga via WhatsApp Chatbot, serta variabel cuaca dan event nasional, sistem ini mampu melakukan peramalan (*forecasting*) penumpukan sampah 7 hari ke depan. Hal ini memungkinkan alokasi rute armada kebersihan secara dinamis dan optimal sebelum tumpukan sampah menimbulkan masalah sanitasi kota.

### 1.3 Tujuan Pengembangan Fitur AI
Dokumen ini disusun untuk menjabarkan spesifikasi kebutuhan pengembangan modul-modul AI tingkat lanjut yang akan diintegrasikan pada dasbor administrator Samling AI. Fokus utama adalah meningkatkan kemampuan *situational awareness* admin melalui visualisasi prediktif, analisis faktor korelasi penumpukan sampah, serta penyediaan tata kelola master data pendukung model AI.

---

## 🏗️ 2. Arsitektur Modul AI & Alur Data

Modul AI Samling AI beroperasi dengan memadukan data telemetri real-time IoT, keluhan warga, data historis sampah, serta kalender event.

```mermaid
graph TD
    %% Entitas Input
    subgraph Data Sources
        IoT[IoT Sensors: Ultrasonic, MQ-135, DHT-22]
        WA[Citizen Reports: WhatsApp Webhook]
        WE[Weather Data: Historical Waste Table]
        EV[Events Table: Jakarta Annual Calendar]
    end

    %% Backend Layer
    subgraph FastAPI Backend & Database
        DB[(SQLite: samling.db)]
        API[API Endpoints: /volume-predictions, /events]
        ML[ML Inference Engine: scikit-learn model]
    end

    %% Frontend Layer
    subgraph React Frontend
        FC[AI Forecast Center: Overview.jsx]
        MAP[Prediction Heatmap: PredictiveMap.jsx]
        WA_PG[Waste Analytics: AIPredictions.jsx]
        MD[Master Data: MasterData.jsx]
        MOD[Detail TPS Modal: ZoneDetailModal.jsx]
    end

    %% Koneksi Data
    IoT -->|POST /sensor-data| API
    WA -->|POST /webhook/whatsapp| API
    EV -->|CRUD /events| DB
    API -->|Read/Write| DB
    ML -->|Inference via model.pkl| API
    
    %% Aliran ke UI
    DB -->|GET /dashboard/summary| FC
    DB -->|GET /zones| MAP
    DB -->|GET /volume-predictions/accuracy-trend| WA_PG
    DB -->|GET /events| MD
    DB -->|GET /volume-predictions/{zone_id}/projections| MOD
```

---

## 📋 3. Spesifikasi Fungsional Fitur AI

---

### Fitur 1: AI Forecast Center (`Overview.jsx`)

#### A. Deskripsi & Tujuan
Mengubah orientasi dasbor utama admin dari pemantauan armada tradisional menjadi pusat ramalan berbasis AI (*AI Forecast Center*). Perubahan ini ditujukan agar admin dapat segera menganticipasi daerah kritis berdasarkan proyeksi algoritma peramalan volume sampah 24 jam ke depan.

#### B. Restrukturisasi Tata Letak (Grid Layout)
Tata letak halaman `Overview.jsx` akan direstrukturisasi dengan urutan *scroll* vertikal sebagai berikut:
1. **Contextual Alert Banner** (Spanduk peringatan cuaca/event dinamis di paling atas).
2. **KPI Metrics Cards Grid** (Mencakup metrik AI baru).
3. **Primary Layout Section** (Tukar Posisi):
   - *Sisi Kiri (8 Kolom)*: **Prediksi Kepenuhan TPS & Rute Rekomendasi Hari Ini** (Sebelumnya di bawah).
   - *Sisi Kanan (4 Kolom)*: **Alur Operasional Harian** (Sebelumnya di atas).
4. **Bottom Layout Section** (Section Baru):
   - **Rute Hari Ini** dan **Driver Siap** (Dipindahkan ke baris paling bawah untuk membersihkan ruang atas).

#### C. Spesifikasi KPI Metrics Cards
Card metrik wajib diposisikan sejajar di bawah Banner utama dengan susunan:
1. **Card 1: "TPS Diprediksi"** (Menggantikan metrik "Prediksi Hari Ini").
   - *Deskripsi*: Menampilkan jumlah total TPS yang diprediksi akan mengalami kenaikan volume sampah hari ini.
   - *Data Source*: Dihitung dari `volume_predictions` di mana `prediction_status` bernilai `WARNING` atau `CRITICAL` untuk tanggal hari ini.
2. **Card 2: "Total TPS Critical"** (Metrik Baru).
   - *Deskripsi*: Jumlah TPS dengan persentase kepenuhan diprediksi $\ge 90\%$.
   - *Visual*: Badge merah berdenyut (*pulse*) dengan angka tebal.
3. **Card 3 & 4: "Top 10 TPS Perlu Diambil"** (Card Gabungan Lebar Ganda / *Double-Width Card*).
   - *Deskripsi*: Card dengan lebar setara 2 card metrik standar untuk menampilkan tabel mini/list 10 TPS dengan volume prediksi kepenuhan tertinggi hari ini.
   - *Komponen UX*: Tabel minimalis tanpa border dengan kolom: Nama TPS, Kecamatan, Prediksi Kepenuhan (%), dan Status Risiko.

#### D. Ilustrasi Wireframe Tata Letak Overview
```
+-----------------------------------------------------------------------------+
|                               ALERT BANNER                                  |
+-----------------------------------------------------------------------------+
| [TPS Diprediksi: 18] | [TPS Critical: 5] | [Top 10 TPS Perlu Diambil        ] |
| Target penjemputan   | Butuh dispatch    | 1. TPS PIK 2 (95% - Critical)    |
| hari ini             | armada segera     | 2. TPS Semper Barat (92% - Crit) |
|                      |                   | ...                              |
+----------------------+-------------------+----------------------------------+
| (Kiri - 8 Kolom)                                         | (Kanan - 4 Kolom)|
|                                                          |                  |
| PREDIKSI KEPENUHAN TPS & RUTE REKOMENDASI HARI INI       | ALUR OPERASIONAL |
| [ Peta Rute & Titik Prioritas Paling Kritis ]            | HARIAN           |
|                                                          | - Ingestion      |
|                                                          | - Dispatch       |
|                                                          | - Archive        |
+----------------------------------------------------------+------------------+
| (Bawah - Full Width Section Baru)                                           |
| RUTE HARI INI                                       | DRIVER SIAP (ONLINE)  |
| - Driver A: Rute 1 (In Progress)                    | - Budi Utomo (Ready)  |
| - Driver B: Rute 2 (Pending)                        | - Eko Prasetyo (Ready)|
+-----------------------------------------------------------------------------+
```

---

### Fitur 2: Prediction Heatmap (`PredictiveMap.jsx`)

#### A. Deskripsi & Tujuan
Meningkatkan kemampuan pemantauan geospasial pada peta interaktif `PredictiveMap.jsx`. Admin harus dapat berinteraksi secara mendalam dengan titik TPS pada peta untuk memicu penanganan langsung jika terjadi anomali visual.

#### B. Alur Interaksi & Spesifikasi Modal
1. **Klik Penanda (Pins) TPS**:
   - Ketika admin mengklik salah satu *marker* / pin TPS di peta, Leaflet.js akan menampilkan *Pop-up Window* kecil di atas pin tersebut.
2. **Konten Pop-up Keterangan Singkat**:
   - Nama TPS (e.g. "TPS RW 01 Semper Barat").
   - Kapasitas Terakhir (e.g. "85.5% Organik").
   - Tombol **"Lihat Detail"** (Menggunakan tombol bergaya aksen hijau `bg-emerald-600` dengan ikon `<FontAwesomeIcon icon={faArrowRight} />`).
3. **Pemicu Modal Detail**:
   - Jika tombol "Lihat Detail" diklik, pop-up akan menutup dan memicu terbukanya **Modal Detail TPS** (`ZoneDetailModal.jsx`).
   - Perilaku, tata letak, data sensor, tab proyeksi, dan transisi modal harus **identik** dengan yang diimplementasikan pada `Zones.jsx` untuk menjaga konsistensi pengalaman pengguna (*Design Consistency*).

```
[ PETA GEOSPASIAL INTERAKTIF ]
    |
    v (Klik Pin TPS)
+-----------------------+
|  TPS RW 01 Semper B.  |
|  Kapasitas: 85.5%     |
|  [ Lihat Detail ] ----+----> Membuka ZoneDetailModal (Identik dengan di Zones.jsx)
+-----------------------+
```

---

### Fitur 3: Waste Analytics (`AIPredictions.jsx`)

#### A. Deskripsi & Tujuan
Mengubah visualisasi performa peramalan sampah pada halaman `AIPredictions.jsx`. Section "Tren Akurasi Data" (yang sebelumnya hanya menampilkan diagram persentase horizontal) akan diganti dengan grafik garis multi-variabel untuk mengevaluasi bias model AI.

#### B. Spesifikasi Multi-Line Chart
Grafik garis menggunakan pustaka Chart.js atau Recharts dengan visualisasi 3 metrik runtun waktu (Time Series):
1. **Garis Histori (Historical)**: Persentase rata-rata volume sampah aktual dari data historis pada hari yang sama di minggu-minggu sebelumnya. (Warna: Abu-abu Slate `#64748B`).
2. **Garis Forecast (AI Prediksi)**: Persentase proyeksi volume sampah yang dihasilkan oleh model AI. (Warna: Biru Indigo `#6366F1`).
3. **Garis Aktual (Sensor IoT)**: Persentase kepenuhan riil yang dibaca oleh sensor ultrasonik di lapangan. (Warna: Hijau Emerald `#10B981`).

#### C. Sistem Penyaringan Data (Filters)
Untuk mencegah *overcrowding* data pada grafik, penyaringan bertingkat diwajibkan:
1. **Wilayah / Kota (Dropdown Utama)**: User wajib memilih Wilayah/Kota administrasi DKI Jakarta terlebih dahulu (Jakarta Utara, Jakarta Timur, Jakarta Barat, Jakarta Selatan, Jakarta Pusat).
2. **Kecamatan (Dropdown Anak)**: Dropdown ini bersifat dinamis. Opsi kecamatan baru akan aktif setelah Wilayah dipilih. Hanya menampilkan kecamatan yang berada di bawah wilayah terpilih (e.g., memilih Jakarta Utara akan memunculkan Cilincing, Koja, Kelapa Gading).
3. **Rentang Waktu (Date Range Chips)**:
   - **7 Hari**: Evaluasi mingguan cepat.
   - **30 Hari**: Pemetaan tren bulanan (Default).
   - **90 Hari**: Analisis makro musiman.

#### D. Struktur Query & Sumber Data database
Data ditarik dari tabel database `historical_waste_data` dan `volume_predictions`:
- **Garis Forecast**: Diambil dari `volume_predictions.predicted_volume_percentage` dikelompokkan berdasarkan tanggal (`created_at`) sesuai dengan filter kecamatan terpilih.
- **Garis Aktual**: Diambil dari `historical_waste_data.current_fill_percentage` dikelompokkan berdasarkan tanggal (`timestamp_prediction`).
- **Garis Histori**: Diambil dari rata-rata `current_fill_percentage` pada hari yang sama (misal: Senin) dalam rentang 3 bulan terakhir.

---

### Fitur 4: Event & Weather Impact

#### A. Sub-Fitur A: Manajemen Event Tahunan
Sistem AI memerlukan data kalender event tahunan untuk meningkatkan akurasi *event_urgency_score*. PRD mendefinisikan pembuatan tabel baru dan antarmuka manajemen event.

##### 1. Spesifikasi Skema Tabel: `events`
Tabel ini bertipe master data dan disimpan pada `samling.db`:

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | Primary Key, Auto Increment | ID unik event |
| `name` | VARCHAR(150) | Not Null | Nama event resmi (e.g. "Pekan Raya Jakarta") |
| `start_date` | DATE | Not Null | Tanggal mulai event |
| `end_date` | DATE | Not Null | Tanggal selesai event |
| `location` | VARCHAR(150) | Nullable | Lokasi spesifik penyelenggaraan (e.g. "JIExpo") |
| `wilayah` | VARCHAR(50) | Not Null | Kota Administrasi (e.g. "Jakarta Pusat") |
| `kecamatan` | VARCHAR(50) | Not Null | Kecamatan terdampak (e.g. "Kemayoran") |
| `urgency_score`| FLOAT | Default 0.5 | Nilai dampak penumpukan sampah (Skala 0.0 - 1.0) |
| `description` | TEXT | Nullable | Deskripsi singkat mengenai jenis kegiatan |
| `created_at` | DATETIME | Default CURRENT_TIMESTAMP | Log pendaftaran event |

##### 2. Spesifikasi Endpoint API CRUD (Public/Tanpa Autentikasi)
Seluruh endpoint CRUD diletakkan di bawah prefix `/api/v1/events` pada backend FastAPI.

* **GET `/events`**
  - *Deskripsi*: Mengambil daftar event tahunan.
  - *Query Parameters (Optional)*:
    - `page` (int): Indeks halaman (e.g., 1).
    - `per_page` (int): Batas data per halaman (e.g., 10).
    - `search` (string): Pencarian nama event.
  - *Respon Sukses - GET ALL (Tanpa Pagination params)*:
    ```json
    {
      "success": true,
      "message": "Seluruh daftar event berhasil diambil.",
      "data": [
        {
          "id": 1,
          "name": "Pekan Raya Jakarta (PRJ)",
          "start_date": "2026-06-12",
          "end_date": "2026-07-14",
          "location": "JIExpo Kemayoran",
          "wilayah": "Jakarta Pusat",
          "kecamatan": "Kemayoran",
          "urgency_score": 0.95,
          "description": "Pameran tahunan memperingati HUT DKI Jakarta."
        }
      ]
    }
    ```
  - *Respon Sukses - WITH PAGINATION*:
    ```json
    {
      "success": true,
      "message": "Daftar event berhasil diambil dengan paginasi.",
      "data": {
        "items": [...],
        "total": 1,
        "page": 1,
        "per_page": 10,
        "total_pages": 1
      }
    }
    ```

* **GET `/events/{event_id}`**
  - *Deskripsi*: Mengambil detail satu event berdasarkan ID.

* **POST `/events`**
  - *Deskripsi*: Menambahkan event tahunan baru ke database.
  - *Request Body*: Model JSON mencakup seluruh field wajib (name, start_date, end_date, wilayah, kecamatan, urgency_score).

* **PUT `/events/{event_id}`**
  - *Deskripsi*: Mengedit informasi event yang sudah terdaftar.

* **DELETE `/events/{event_id}`**
  - *Deskripsi*: Menghapus event dari database.

##### 3. Integrasi UI Master Data (`MasterData.jsx`)
- Menambahkan tab menu baru bernama **"Event"** di komponen `<MasterTabs>` pada `MasterData.jsx` (berdampingan dengan Driver, Fleet, dan Sensor).
- Menampilkan `<EventTable>` yang menyajikan kolom: Nama Event, Tanggal Pelaksanaan, Wilayah, Kecamatan, Urgency Score (0.0 - 1.0), dan tombol Aksi (Edit & Hapus).
- Mengintegrasikan tombol "Tambah Event" yang memicu terbukanya `<EventModal>` untuk pengisian formulir input/update event baru.

---

#### B. Sub-Fitur B: Weather & AI Insight
Menganalisis dampak cuaca buruk terhadap kecepatan penumpukan sampah. Air hujan meningkatkan berat sampah organik dan memicu pembusukan lebih cepat, yang dideteksi oleh sensor MQ-135 (Gas).

##### 1. Ekstraksi Data Cuaca & Korelasi Historis
- Backend mengekstrak nilai curah hujan harian dari kolom `rainfall_today` pada tabel `historical_waste_data` di database samling.
- Model AI mencocokkan koordinat TPS terkait dengan data histori curah hujan terbaru untuk mengevaluasi apakah lonjakan sampah organik disebabkan oleh hari hujan.

##### 2. Tampilan AI Insight Panel
Di dalam Detail Modal TPS, sistem harus menampilkan panel **AI Insight** yang menjabarkan penyebab terbesar lonjakan sampah dengan 4 indikator status:
1. **Penyebab Terbesar (Largest Driver)**: Label konseptual yang menyatakan faktor dominan saat ini (e.g. *"Curah Hujan Tinggi (Rain)"* atau *"Hari Libur Panjang (Holiday)"*).
2. **Rain Indicator**: Menampilkan curah hujan riil saat ini (e.g. `24.5 mm (Hujan Sedang)`) beserta bobot pengaruhnya.
3. **Holiday Indicator**: Status biner (`Ya` / `Tidak`) yang menunjukkan apakah tanggal prediksi bertepatan dengan libur nasional.
4. **Weekend Indicator**: Status biner (`Ya` / `Tidak`) berdasarkan hari sabtu/minggu.

```
+-----------------------------------------------------------+
| 💡 AI INSIGHT: PENYEBAB LONJAKAN                          |
+-----------------------------------------------------------+
| Faktor Dominan: Hujan Lebat & Pembusukan Cepat (Rain)     |
|                                                           |
| 🌧️ Curah Hujan  : 42.1 mm (Tinggi - Dampak Berat)         |
| 📅 Hari Libur   : Tidak (Normal)                          |
| 🗓️ Akhir Pekan  : Ya (Dampak Ringan)                      |
+-----------------------------------------------------------+
```

---

### Fitur 5: Risk Assessment

#### A. Deskripsi & Tujuan
Menampilkan laporan evaluasi risiko penimbunan sampah secara instan langsung di dalam modal detail TPS (`ZoneDetailModal.jsx`) yang diakses dari halaman `Zones.jsx` maupun `PredictiveMap.jsx`.

#### B. Analisis Faktor Pemicu ("Why?")
Bagian ini wajib menjawab pertanyaan admin *"Mengapa TPS ini dikategorikan Warning atau High Priority oleh AI?"*. Tampilkan daftar bobot kontribusi variabel penyebab dalam bentuk persentase:
- **Trend Historis (Historical Trend)**: Kontribusi volume rata-rata harian (e.g. `45%`).
- **Hari Libur (Holiday)**: Dampak lonjakan libur nasional (e.g. `20%`).
- **Curah Hujan (Rain/Weather)**: Dampak penambahan bobot air hujan (e.g. `25%`).
- **Akhir Pekan (Weekend)**: Dampak keramaian mingguan (e.g. `10%`).

#### C. Skor Keyakinan Model (Confidence Level)
- Menampilkan persentase tingkat akurasi prediksi model AI (e.g., `Confidence Level: 89.4%`).
- *Ketentuan Warna*:
  - Confidence $\ge 90\%$: Hijau Emerald (`text-emerald-600` / "Tinggi").
  - Confidence $80\% - 89\%$: Amber/Kuning (`text-amber-600` / "Sedang").
  - Confidence $< 80\%$: Merah (`text-red-650` / "Rendah - Butuh Kalibrasi").

---

### Fitur 6: AI Model Dashboard

#### A. Deskripsi & Tujuan
Membuat halaman baru pada sistem dasbor admin khusus untuk administrator memantau metrik keandalan model *Machine Learning* yang digunakan oleh Samling AI.

#### B. Detail Metrik Evaluasi Model AI
Halaman menampilkan kartu ringkasan berisi parameter performa model berikut:
* **Nama Model**: `XGBoost Regressor / Random Forest Ensemble (v2.1.0)`
* **Jumlah Dataset**: `45,210 Baris Riwayat Kebersihan DKI Jakarta`
* **Mean Absolute Error (MAE)**: `3.45%`
* **Mean Absolute Percentage Error (MAPE)**: `4.12%`
* **Root Mean Squared Error (RMSE)**: `4.89%`
* **Akurasi Global (Accuracy)**: `95.88%`
* **Pelatihan Terakhir (Last Training)**: `15 Juli 2026, 23:59 WIB`

#### C. Variabel Feature Importance
Bagian ini menyajikan bagan batang horizontal (*horizontal bar chart*) yang menggambarkan pengaruh/bobot masing-masing variabel input terhadap penentuan hasil prediksi volume sampah:
1. **Historical Trend (Histori Volume)**: Bobot `38%`
2. **Weather Impact (Curah Hujan & Suhu)**: Bobot `22%`
3. **Citizen Report (Volume Laporan Warga via WA)**: Bobot `18%`
4. **Public Event (Skala Keramaian Acara)**: Bobot `12%`
5. **Holiday & Calendar (Hari Libur)**: Bobot `10%`

*Catatan Teknis:* Karena endpoint performa model dari server AI belum diimplementasikan di backend, frontend wajib mendefinisikan skema data dummy terstruktur di file konfigurasi lokal agar dapat langsung dipetakan ke API nyata di masa mendatang.

---

### Fitur 7: AI Prediction Insight ("AI Factor")

#### A. Deskripsi & Tujuan
Menambahkan section baru bernama **"AI Factor"** di dalam modal detail TPS (`ZoneDetailModal.jsx`). Komponen ini fokus menyajikan korelasi 4 pilar utama penentu volume sampah secara kontekstual per TPS.

#### B. Spesifikasi Analisis 4 Faktor Korelasi
Komponen menyajikan kartu kisi (*grid cards*) minimalis berisi teks analisis terstruktur:
1. **Historical Trend**:
   - *Deskripsi*: Menilai apakah tren sampah di TPS ini dalam kondisi stabil, naik, atau turun dibanding rata-rata 3 minggu sebelumnya.
   - *Indicator*: Label *“Meningkat 5.2%”* atau *“Stabil”*.
2. **Weather**:
   - *Deskripsi*: Pengaruh cuaca lokal hari ini terhadap kelembapan sampah.
   - *Indicator*: Label *“Dampak Tinggi (Hujan Lebat)”* atau *“Dampak Rendah (Cerah)”*.
3. **Public Event**:
   - *Deskripsi*: Menunjukkan apakah ada event terdaftar pada tabel `events` dalam radius kecamatan TPS tersebut pada minggu ini.
   - *Indicator*: Label *“Event Aktif: PRJ (Kemayoran)”* atau *“Tidak Ada Event”*.
4. **Citizen Report**:
   - *Deskripsi*: Jumlah laporan penumpukan sampah aktif di wilayah RT/RW TPS tersebut dalam 24 jam terakhir yang dikirim via WhatsApp.
   - *Indicator*: Label *“3 Laporan Aktif (Urgensi Tinggi)”* atau *“0 Laporan Warga”*.

---

## 💾 4. Sumber Data & Ketentuan Database

Semua data yang divisualisasikan pada modul dasbor admin wajib dapat dipertanggungjawabkan sumbernya.

### 4.1 Peta Sumber Data dari Tabel `samling.db`
1. **Total TPS Critical**:
   - Query: `SELECT COUNT(*) FROM zones WHERE risk_status = 'High Priority'`
2. **Kecamatan & Wilayah Filter Options**:
   - Query: `SELECT DISTINCT wilayah, kecamatan FROM zones`
3. **Volume Prediksi (Forecast)**:
   - Query: `SELECT predicted_volume_percentage, created_at FROM volume_predictions WHERE tps_id = :tps_id ORDER BY created_at DESC LIMIT 7`
4. **Data Cuaca (Curah Hujan)**:
   - Query: `SELECT rainfall_today FROM historical_waste_data WHERE tps_id = :tps_id ORDER BY timestamp_prediction DESC LIMIT 1`

### 4.2 Argumen Teknis Data Tidak Tersedia & Solusi Alternatif
Beberapa data tingkat lanjut tidak tersimpan langsung secara eksplisit pada model SQLite saat ini. Berikut adalah analisis PM dan solusinya:

#### 1. Real-time Weather Forecast (Curah Hujan Prediktif)
* **Kondisi Saat Ini**: Tabel `historical_waste_data` hanya mencatat `rainfall_today` secara historis per baris log. Tidak ada data ramalan cuaca masa depan.
* **Argumen Teknis**: Sistem AI membutuhkan prediksi curah hujan 3 hari ke depan untuk menghitung estimasi lonjakan sampah sebelum hujan turun.
* **Solusi Alternatif**: 
  - *Integrasi Pihak Ketiga*: Menggunakan API resmi **BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)** atau **OpenWeatherMap API**.
  - *Mekanisme*: Backend FastAPI membuat service worker `weather_service.py` untuk mengambil data cuaca harian berdasarkan latitude/longitude TPS, lalu menyimpan skor estimasi hujan ke kolom baru `predicted_rainfall` pada saat proses *forecasting batch* dijalankan.

#### 2. Metrik Evaluasi Model AI (MAE, RMSE, MAPE)
* **Kondisi Saat Ini**: Metrik evaluasi hanya tersimpan dalam metadata biner model di file `forecast_waste_volume_model.pkl`. Tidak ada tabel database khusus yang menyimpan performa latih model secara berkala.
* **Argumen Teknis**: Performa model berubah setiap kali dilakukan retraining. Menulis kode keras (*hardcode*) di frontend akan menyulitkan pemantauan jangka panjang.
* **Solusi Alternatif**:
  - *Simulasi Dummy Terstruktur*: Untuk tahap awal, backend akan menyediakan static endpoint `/api/v1/ai-model/metrics` yang membaca file JSON konfigurasi lokal model (`model_metrics.json`) hasil dump dari skrip training python.
  - *Tabel Log Training (Fase 2)*: Membuat tabel database baru `ai_training_logs` untuk mencatat riwayat akurasi model setiap kali cron job retraining selesai berjalan.

---

## 🎨 5. Spesifikasi Desain & UX/UI (Aesthetics Guide)

### 5.1 Konsistensi Desain
Semua komponen baru wajib mematuhi **`DESIGN_SYSTEM_ADMIN_SAMLING.md`**. Antarmuka harus mengutamakan kerapian visual dengan warna semantik terstandarisasi untuk menghindari kebingungan administratif.

### 5.2 Skema Warna Semantik (Palette)
* **Primary (Brand Color)**: Emerald/Green
  - Utama: `#059669` (Emerald 600)
  - Hover: `#10B981` (Emerald 500)
  - Background Ringan: `#E6F4EA` (Emerald 50)
* **Status Bahaya / High Priority**: Red
  - Utama: `#DC2626` (Red 600)
  - Background Ringan: `#FEF2F2` (Red 50)
  - Border: `#FCA5A5` (Red 300)
* **Status Waspada / Warning**: Amber/Yellow
  - Utama: `#D97706` (Amber 600)
  - Background Ringan: `#FEF3C7` (Amber 50)
  - Border: `#FDE047` (Yellow 300)
* **Status Normal**: Emerald/Green
  - Utama: `#10B981` (Emerald 500)
  - Background Ringan: `#F0FDF4` (Green 50)

### 5.3 Micro-Animations & Interaksi
- **Hover State**: Semua tombol, tab menu, dan baris daftar TPS wajib memiliki efek transisi naik (`hover:-translate-y-0.5 transition-all duration-200`) disertai bayangan lembut (`hover:shadow-md`).
- **Loading State**: Saat memuat grafik multi-line atau membuka modal detail TPS, tampilkan animasi pemuat (*spinner*) menggunakan ikon `<FontAwesomeIcon icon={faSpinner} className="animate-spin" />` dengan warna `text-emerald-500`.
- **High Priority Pulse**: Penanda TPS dengan status High Priority (Merah) di halaman `PredictiveMap.jsx` harus dilengkapi efek ring berdenyut (*pulse border animation*) untuk memandu mata admin mendeteksi masalah lebih cepat.

---

## ⚠️ 6. Penanganan Kondisi Khusus (Edge Cases)

| Skenario | Dampak pada Sistem | Penanganan & Indikator UX |
| :--- | :--- | :--- |
| **Data Sensor IoT Mati** | Data sensor telemetri tidak terkirim selama lebih dari 12 jam. | Node TPS pada peta berubah menjadi warna Abu-abu Slate (`#94A3B8`) dengan garis tepi putus-putus. Teks tooltip berbunyi: *"Koneksi IoT Terputus. Menampilkan data estimasi historis."* |
| **Model AI Timeout / Down** | Server gagal mengembalikan ramalan volume sampah 7 hari ke depan. | Dasbor grafik multi-line menampilkan spanduk peringatan kuning: *"Gagal memuat prediksi AI terbaru. Sistem menampilkan data rata-rata historis konvensional."* |
| **Event Tumpang Tindih (Overlap)** | Ada dua event besar di kecamatan yang sama pada waktu bersamaan. | Sistem menjumlahkan skor urgensi secara logaritmik (tidak melebihi batas atas 1.0) dan menandai event tersebut di UI master data dengan label *"Dampak Akumulatif Tinggi"*. |
| **Spam Pengaduan Warga** | Laporan warga yang sama dikirim berulang kali dari nomor WhatsApp berbeda. | Algoritma *text similarity* (Difflib) pada backend mengelompokkan laporan dalam radius < 50 meter dan rentang waktu 12 jam ke dalam satu tiket laporan utama. Menampilkan indikator di UI: *“+N Laporan Serupa”*. |

---

## 🧪 7. Rencana Pengujian (QA & Verification Plan)

### 7.1 Unit Testing (Backend & Database)
- **Tabel `events`**: Memverifikasi bahwa operasi insert, read, update, dan delete berjalan dengan sukses menggunakan SQLite backend query.
- **Endpoint GET `/events`**:
  - Tes parameter `page=1&per_page=5` untuk memastikan data terpotong dengan benar.
  - Tes pencarian `/events?search=PRJ` mengembalikan hasil yang relevan.
- **Fallback Korelasi Cuaca**: Menguji API insight detail TPS mengembalikan fallback "Data Historis" jika data cuaca real-time gagal terhubung.

### 7.2 Uji Manual Antarmuka (Frontend UX/UI)
- Memastikan navigasi tab "Event" pada `MasterData.jsx` memuat daftar tabel event dengan tata letak responsif.
- Membuka modal detail TPS dari `PredictiveMap.jsx` lewat tombol "Lihat Detail" pop-up dan memastikan seluruh data "AI Factor" dan persentase "Confidence Level" terisi dengan data yang valid (dummy terstruktur atau database).
- Mengubah filter dropdown Kota dan Kecamatan pada `AIPredictions.jsx` dan memastikan grafik langsung diperbarui (*render update*) secara asinkron tanpa merusak layout dasbor.
