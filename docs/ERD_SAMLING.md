### 📊 Skema Database Final SAMLING AI (Versi Multi-Role)

**1. Table: `users` (Peleburan Admin & Driver)**
*Tabel sentral untuk autentikasi dan manajemen entitas manusia di sistem.*
| Column Name | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | INTEGER | Primary Key, Auto Increment | ID unik pengguna |
| `name` | VARCHAR | Not Null | Nama Admin atau Driver |
| `username` | VARCHAR | Not Null, Unique | Nama pengguna untuk login |
| `password` | VARCHAR | Not Null | Password yang sudah di- *hash* (jangan simpan *plain text*) |
| `role` | VARCHAR | Not Null (Enum: 'admin', 'driver') | Penentu hak akses sistem |
| `whatsapp_number` | VARCHAR | Nullable | Nomor WA (Wajib untuk driver agar notifikasi rute masuk) |
| `zone_id` | INTEGER | Foreign Key (`zones.id`), Nullable | ID Wilayah tugas (Hanya diisi jika `role` = 'driver') |
| `status` | VARCHAR | Nullable (Enum: 'Available', 'On Duty', 'Offline') | Status ketersediaan driver di lapangan |
| `created_at` | DATETIME | Default CURRENT_TIMESTAMP | Waktu akun dibuat |

**2. Table: `zones` (Pusat Data Wilayah TPS)**
*Tabel master data lokasi fisik yang akan dipetakan di Leaflet.js.*
| Column Name | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | INTEGER | Primary Key, Auto Increment | ID unik wilayah |
| `name` | VARCHAR | Not Null | Nama Sektor / RT / RW / TPS |
| `latitude` | FLOAT | Not Null | Titik koordinat peta (Y) |
| `longitude` | FLOAT | Not Null | Titik koordinat peta (X) |
| `risk_status` | VARCHAR | Not Null (Enum: 'Normal', 'Warning', 'High Priority') | Status klasifikasi hasil dari AI |
| `created_at` | DATETIME | Default CURRENT_TIMESTAMP | Waktu zona ditambahkan |

**3. Table: `sensor_data` (Integrasi IoT)**
*Penyimpanan riwayat persentase kepenuhan sampah dari perangkat keras ESP32.*
| Column Name | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | INTEGER | Primary Key, Auto Increment | ID unik riwayat sensor |
| `zone_id` | INTEGER | Foreign Key (`zones.id`) | Relasi ke lokasi TPS |
| `sensor_type` | VARCHAR | Not Null (Enum: 'organic', 'anorganic') | Pemisah tipe bak sampah |
| `fill_percentage` | INTEGER | Not Null | Persentase kepenuhan (0-100) |
| `created_at` | DATETIME | Default CURRENT_TIMESTAMP | Waktu data diterima (*timestamp*) |

**4. Table: `volume_predictions` (Integrasi AI Amadeus)**
*Penyimpanan hasil forecasting lonjakan sampah untuk ditampilkan ke grafik React.*
| Column Name | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | INTEGER | Primary Key, Auto Increment | ID unik hasil prediksi |
| `zone_id` | INTEGER | Foreign Key (`zones.id`) | Lokasi yang diprediksi AI |
| `predicted_volume` | FLOAT | Not Null | Proyeksi angka/volume sampah |
| `confidence_score` | FLOAT | Not Null | Tingkat akurasi/keyakinan model AI |
| `target_time` | DATETIME | Not Null | Waktu di masa depan yang diprediksi |
| `created_at` | DATETIME | Default CURRENT_TIMESTAMP | Waktu prediksi dihasilkan |

**5. Table: `citizen_reports` (Integrasi WA Chatbot Agung)**
*Penyimpanan data laporan warga yang sudah terstruktur dari Twilio.*
| Column Name | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | INTEGER | Primary Key, Auto Increment | ID unik laporan |
| `whatsapp_number` | VARCHAR | Not Null | Nomor pelapor (untuk *callback* konfirmasi) |
| `report_content` | TEXT | Not Null | Isi keluhan/laporan tumpukan sampah |
| `zone_id` | INTEGER | Foreign Key (`zones.id`), Nullable | ID Wilayah terdekat dari keluhan |
| `created_at` | DATETIME | Default CURRENT_TIMESTAMP | Waktu laporan masuk ke sistem |

**6. Table: `route_recommendations` (Optimasi Rute Armada)**
*Penyimpanan instruksi rute dinamis yang dialokasikan ke masing-masing pengemudi.*
| Column Name | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | INTEGER | Primary Key, Auto Increment | ID unik instruksi rute |
| `driver_id` | INTEGER | Foreign Key (`users.id`) | Relasi ke pengguna dengan `role`='driver' |
| `route_json` | TEXT | Not Null | Urutan rute (Contoh: `[1, 3, 5, 4, 2]`) |
| `status` | VARCHAR | Not Null (Enum: 'Pending', 'In Progress', 'Completed') | Pantauan progres tugas driver |
| `created_at` | DATETIME | Default CURRENT_TIMESTAMP | Waktu rute ditugaskan |
| `updated_at` | DATETIME | Default CURRENT_TIMESTAMP | Waktu rute terakhir diubah statusnya |

---

### 💡 Dampak pada Kode FastAPI (Baca agar kamu memahami dampaknya terhadap stabilitas kode dalam projek ini)
Dengan skema final ini:
1. **Endpoint Login (`/api/v1/auth/login`)**: Akan mengecek kombinasi *username* dan *password* di tabel `users`. Setelah berhasil, sistem akan mengembalikan JWT Token yang memuat `role`.
2. **Endpoint Driver (`/api/v1/drivers`)**: Tidak perlu query ke tabel terpisah lagi. Endpoint ini cukup melakukan *query* seperti: `SELECT * FROM users WHERE role = 'driver'`.
3. **Relasi Rute yang Solid**: *Foreign Key* `driver_id` di tabel `route_recommendations` sekarang merujuk dengan aman ke `users.id`, sehingga tidak ada lagi data rute yang "hilang pemilik".