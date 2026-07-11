# 📖 Samling AI - API Specification (Spesifikasi Endpoint)

Dokumen ini menyediakan spesifikasi lengkap seluruh endpoint API yang tersedia pada sistem **Samling AI** untuk dikonsumsi oleh tim Frontend (React), Tim Chatbot (Node.js), dan Tim IoT/AI.

---

## 🔒 Format Umum & Autentikasi

### Base URL
* Local Development: `http://localhost:8000/api/v1`

### Public URL
* Production: `https://api-samling.naufalrafa.my.id/api/v1`

## Docs swagger interaktif: `https://api-samling.naufalrafa.my.id/docs`

### Autentikasi
Sebagian besar endpoint memerlukan token JWT. Masukkan token pada Header HTTP dengan skema Bearer Token:
```http
Authorization: Bearer <jwt_access_token>
```

### Format Respon Sukses (Standard Success Wrapper)
```json
{
  "success": true,
  "message": "Pesan sukses representatif.",
  "data": {} // Objek data utama atau array
}
```

### Format Respon Gagal (Standard Error Wrapper)
```json
{
  "success": false,
  "message": "Deskripsi detail mengenai kegagalan sistem atau validasi."
}
```

---

## 🔑 1. Autentikasi (Authentication)

### POST `/auth/login` (Login Umum)
* **Deskripsi**: Mengautentikasi pengguna secara umum (Admin & Driver) menggunakan payload JSON.
* **Auth**: Public
* **Request Body (JSON)**:
  * `username` (string, required)
  * `password` (string, required)
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Login berhasil!",
    "data": {
      "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
      "token_type": "bearer",
      "user": {
        "id": 1,
        "username": "admin_samling",
        "role": "admin"
      }
    }
  }
  ```

### POST `/auth/login/admin` (Login Admin - Form Input)
* **Deskripsi**: Mengautentikasi khusus administrator menggunakan format input Form Data (OAuth2 password flow).
* **Auth**: Public
* **Request Body (Form Data)**:
  * `username` (string, required)
  * `password` (string, required)
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Login admin berhasil!",
    "data": {
      "access_token": "eyJhbGciOiJIUzI1...",
      "token_type": "bearer",
      "user": {
        "id": 1,
        "username": "admin_samling",
        "role": "admin"
      }
    }
  }
  ```

### POST `/auth/login/driver` (Login Driver - Form Input)
* **Deskripsi**: Mengautentikasi khusus supir armada menggunakan format input Form Data.
* **Auth**: Public
* **Request Body (Form Data)**:
  * `username` (string, required)
  * `password` (string, required)
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Login driver berhasil!",
    "data": {
      "access_token": "eyJhbGciOiJI...",
      "token_type": "bearer",
      "user": {
        "id": 2,
        "username": "driver_budi",
        "name": "Budi Utomo",
        "whatsapp_number": "6281234567890",
        "status": "Offline",
        "role": "driver"
      }
    }
  }
  ```

---

## 🗺️ 2. Wilayah TPS (Zones)

### GET `/zones`
* **Deskripsi**: Mengambil seluruh daftar wilayah TPS untuk dipetakan di Leaflet.js.
* **Auth**: Bearer Token
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Daftar wilayah berhasil diambil.",
    "data": [
      {
        "id": 1,
        "name": "TPS RW 01 Semper Barat",
        "wilayah": "Jakarta Utara",
        "kecamatan": "Cilincing",
        "kelurahan": "Semper Barat",
        "jenis_tps": "Tipe 4",
        "alamat": "Jl Belibis IV",
        "latitude": -6.1245039,
        "longitude": 106.9158877,
        "risk_status": "Normal"
      }
    ]
  }
  ```

### POST `/zones`
* **Deskripsi**: Membuat data wilayah TPS baru.
* **Auth**: Bearer Token
* **Request Body (JSON)**:
  * `name` (string, required)
  * `wilayah` (string, required)
  * `kecamatan` (string, required)
  * `kelurahan` (string, required)
  * `jenis_tps` (string, required)
  * `alamat` (string, optional)
  * `latitude` (float, required)
  * `longitude` (float, required)

### GET `/zones/filter-options`
* **Deskripsi**: Mengambil daftar kecamatan unik yang tersedia untuk opsi dropdown filter wilayah.
* **Auth**: Bearer Token

### GET `/zones/kecamatan/{kecamatan}`
* **Deskripsi**: Mengambil wilayah TPS berdasarkan nama kecamatan tertentu.
* **Auth**: Bearer Token

### GET `/zones/{zone_id}`
* **Deskripsi**: Mengambil detail satu data wilayah TPS berdasarkan ID.
* **Auth**: Bearer Token

### PUT `/zones/{zone_id}`
* **Deskripsi**: Mengupdate data wilayah TPS.
* **Auth**: Bearer Token

### DELETE `/zones/{zone_id}`
* **Deskripsi**: Menghapus data wilayah TPS.
* **Auth**: Bearer Token

---

## 🚚 3. Supir Armada (Drivers)

*Catatan: Driver dilebur ke dalam tabel users dengan role `"driver"`. Driver tidak lagi diikat secara statis ke kolom `zone_id` karena penugasan area kerja dilakukan dinamis berdasarkan rute rekomendasi.*

### GET `/drivers`
* **Deskripsi**: Mengambil seluruh daftar driver aktif.
* **Auth**: Bearer Token
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Daftar driver berhasil diambil.",
    "data": [
      {
        "id": 2,
        "name": "Budi Utomo",
        "username": "driver_budi",
        "whatsapp_number": "6281234567890",
        "fleet_id": 1,
        "status": "Offline",
        "role": "driver",
        "created_at": "2026-07-05T05:20:21"
      }
    ]
  }
  ```

### POST `/drivers`
* **Deskripsi**: Mendaftarkan driver baru (sekaligus membuat akun User baru).
* **Auth**: Bearer Token
* **Request Body (JSON)**:
  * `name` (string, required)
  * `whatsapp_number` (string, format standard: e.g. "6281234567890")
  * `fleet_id` (int, optional)
  * `username` (string, required)
  * `password` (string, required)
* **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Driver baru berhasil didaftarkan.",
    "data": {
      "id": 6,
      "name": "Eko Prasetyo",
      "username": "driver_eko",
      "whatsapp_number": "6281299990000",
      "fleet_id": 1,
      "status": "Offline",
      "role": "driver",
      "created_at": "2026-07-05T06:50:00"
    }
  }
  ```

### GET `/drivers/{id}`
* **Deskripsi**: Mengambil informasi driver berdasarkan ID.
* **Auth**: Bearer Token

### PUT `/drivers/{id}`
* **Deskripsi**: Memperbarui profil atau status supir secara dinamis.
* **Auth**: Bearer Token
* **Path Parameters**:
  * `id` (int, required) - ID Driver (User)
* **Request Body (JSON)**:
  * `name` (string, optional)
  * `whatsapp_number` (string, optional)
  * `fleet_id` (int, optional)
  * `username` (string, optional)
  * `password` (string, optional)
  * `status` (string, optional - "Available", "On Duty", "Offline")
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Data driver berhasil diperbarui.",
    "data": {
      "id": 2,
      "name": "Budi Utomo Prasetyo",
      "username": "driver_budi",
      "whatsapp_number": "6281234567890",
      "fleet_id": 1,
      "status": "Available",
      "role": "driver",
      "created_at": "2026-07-05T05:20:21"
    }
  }
  ```

### DELETE `/drivers/{id}`
* **Deskripsi**: Menghapus data driver dari database.
* **Auth**: Bearer Token

---

## 📡 4. Data Sensor IoT (Sensor Data)

### POST `/sensor-data` (IoT Device Ingestion)
* **Deskripsi**: Menerima data pembacaan telemetri dari perangkat keras IoT ESP32 secara publik. Menyinkronkan status risiko TPS secara dinamis dan melakukan siaran (*broadcast*) pesan pembaruan real-time ke seluruh klien WebSocket.
* **Auth**: Public
* **Request Body (JSON)**:
  * `zone_id` (int, required)
  * `sensor_type` (string, required) - Pilihan ENUM valid: `Ultrasonic-Organic`, `Ultrasonic-Anorganic`, `MQ-135`, `DHT-22-Temp`, `DHT-22-Humid`
  * `fill_percentage` (float, required) - 0.0 sampai 100.0
  * `value` (float, required) - Nilai pembacaan mentah
* **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Data sensor berhasil diperbarui dan status wilayah berhasil disinkronkan.",
    "data": {
      "id": 16,
      "zone_id": 1,
      "sensor_type": "Ultrasonic-Organic",
      "fill_percentage": 85.5,
      "value": 15.0,
      "created_at": "2026-07-10T16:18:44",
      "updated_at": "2026-07-10T16:18:44"
    }
  }
  ```

### GET `/sensor-data/latest`
* **Deskripsi**: Mengambil pembacaan telemetri terakhir untuk semua wilayah TPS (Mendukung filter query `zone_id`). Menghasilkan maksimal 1 data sensor terbaru untuk setiap `zone_id` dan `sensor_type`.
* **Auth**: Bearer Token

### GET `/sensor-data/history`
* **Deskripsi**: Mengambil log riwayat seluruh data sensor untuk analisis grafik tren runtun waktu.
* **Auth**: Bearer Token

### POST `/sensor-data/manual`
* **Deskripsi**: Membuat data sensor secara manual lewat panel admin.
* **Auth**: Bearer Token

### GET `/sensor-data/{id}`
* **Deskripsi**: Mengambil data sensor tertentu berdasarkan ID.
* **Auth**: Bearer Token

### PUT `/sensor-data/{id}`
* **Deskripsi**: Mengupdate data sensor secara manual.
* **Auth**: Bearer Token

### DELETE `/sensor-data/{id}`
* **Deskripsi**: Menghapus baris rekaman data sensor.
* **Auth**: Bearer Token

---

## 🔮 5. Prediksi Volume Sampah AI (Volume Predictions)

### GET `/volume-predictions/{zone_id}/projections`
* **Deskripsi**: Mengambil hasil prediksi/proyeksi volume tumpukan sampah 7 hari ke depan untuk wilayah TPS tertentu untuk divisualisasikan dalam grafik Chart.js.
* **Auth**: Bearer Token
* **Path Parameters**:
  * `zone_id` (int, required)
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Proyeksi volume sampah berhasil diambil.",
    "data": [
      {
        "date": "2026-07-06",
        "predicted_volume_m3": 4.2
      },
      {
        "date": "2026-07-07",
        "predicted_volume_m3": 5.1
      }
    ]
  }
  ```

### POST `/volume-predictions`
* **Deskripsi**: Endpoint bagi modul AI / Machine Learning untuk menyimpan hasil proyeksi prediksi baru.
* **Auth**: Bearer Token

---

## 📢 6. Laporan Pengaduan Warga (Citizen Reports)

### GET `/citizen-reports`
* **Deskripsi**: Mengambil seluruh daftar aduan warga untuk diplot ke papan Kanban admin. Respon otomatis mengelompokkan keluhan sejenis berdasarkan kemiripan lokasi dan waktu.
* **Auth**: Bearer Token
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Daftar laporan warga berhasil diambil.",
    "data": [
      {
        "id": 1,
        "phone_number": "6289988776655",
        "message": "Tumpukan sampah meluap di belakang pasar PIK Semper Barat",
        "status": "Baru",
        "category": "Organik",
        "zone_id": 1,
        "image_path": "uploads/pik_sampah.jpg",
        "created_at": "2026-07-05T05:20:21",
        "is_duplicate": false,
        "duplicate_group_id": null
      }
    ]
  }
  ```

### POST `/webhook/whatsapp` (WhatsApp Chatbot Webhook)
* **Deskripsi**: Endpoint penerima pesan pengaduan warga dari Chatbot Node.js. Mengintegrasikan algoritma *text similarity* (Difflib) untuk mendeteksi aduan serupa dalam 12 jam terakhir pada wilayah yang sama, mengeset bendera `is_duplicate` secara cerdas untuk menghindari spam.
* **Auth**: Public
* **Request Body (JSON)**:
  * `phone_number` (string, required)
  * `message` (string, required)
  * `zone_id` (int, required)
  * `image_path` (string, optional)
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Webhook whatsapp berhasil diproses."
  }
  ```

### PUT `/citizen-reports/{id}`
* **Deskripsi**: Memperbarui status penanganan keluhan warga (`"Baru"`, `"Sedang Ditangani"`, `"Selesai"`).
* **Auth**: Bearer Token

---

## 🗺️ 7. Optimasi & Rekomendasi Rute Supir (Route Recommendations)

### POST `/route-recommendations`
* **Deskripsi**: Menyimpan susunan rute optimal yang telah dihitung oleh sistem. Endpoint ini menerima `driver_id = null` jika rute ingin dibuat sebagai *Unassigned* (belum ditugaskan ke supir).
* **Auth**: Bearer Token
* **Request Body (JSON)**:
  * `driver_id` (int, optional - default: `null`)
  * `route_json` (string, format JSON Array berisi ID Zone) - e.g. `"[1, 3, 5, 2, 4]"`
* **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Rekomendasi rute baru berhasil disimpan.",
    "data": {
      "id": 1,
      "driver_id": null,
      "route_json": "[1, 3, 5, 2, 4]",
      "status": "Pending",
      "created_at": "2026-07-05T05:20:21"
    }
  }
  ```

### GET `/route-recommendations/latest`
* **Deskripsi**: Mengambil rekomendasi rute optimal terbaru secara umum.
* **Auth**: Bearer Token

### GET `/route-recommendations/driver/{driver_id}` (Rute Aktif Driver)
* **Deskripsi**: Mengambil rute pengangkutan sampah aktif (Pending / In Progress) milik supir terkait.
* **Auth**: Bearer Token

### POST `/route-recommendations/dispatch/{driver_id}` (Dispatch & Dynamic Assign)
* **Deskripsi**: Mengirim manifes rute optimal ke driver via WhatsApp Gateway (simulasi).
  * *Logika Dynamic Allocation*: Jika driver tidak memiliki rute aktif, sistem akan mencari rekomendasi rute teranyar berstatus `"Pending"` yang belum memiliki supir (`driver_id IS NULL`), mengaitkan rute tersebut ke driver secara otomatis, lalu memperbarui status rute menjadi `"In Progress"` dan status kerja driver menjadi `"On Duty"`.
* **Auth**: Bearer Token
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Rute rekomendasi berhasil ditugaskan ke Driver Budi Utomo secara digital.",
    "data": {
      "driver_id": 2,
      "driver_name": "Budi Utomo",
      "route_status": "In Progress",
      "driver_status": "On Duty"
    }
  }
  ```

### PUT `/route-recommendations/{id}/status`
* **Deskripsi**: Memperbarui status rute supir. Jika diubah ke `"Completed"`, status driver otomatis diubah kembali menjadi `"Available"`.
* **Auth**: Bearer Token

---

## 📊 8. Dashboard

### GET `/dashboard/summary`
* **Deskripsi**: Menyediakan data metrik agregasi ringkas untuk memuat halaman dasbor admin dengan cepat.
* **Auth**: Bearer Token
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Data ringkasan dashboard berhasil diambil.",
    "data": {
      "alert_zones_count": 3,
      "average_fill_percentage": 52.0,
      "total_citizen_reports": 11
    }
  }
  ```

---

## 🚚 9. Kelola Armada (Fleets)

### GET `/fleets`
* **Deskripsi**: Mengambil daftar seluruh tipe armada kendaraan pengumpul sampah DLH Jakarta.
* **Auth**: Bearer Token
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Daftar tipe armada berhasil diambil.",
    "data": [
      {
        "id": 1,
        "name": "Truk Compactor RDF",
        "category": "Tengah",
        "type": "Truk",
        "capacity": "10 Ton",
        "total_units": 54,
        "created_at": "2026-07-09T14:10:00"
      }
    ]
  }
  ```

### POST `/fleets`
* **Deskripsi**: Mendaftarkan tipe armada kendaraan baru.
* **Auth**: Bearer Token
* **Request Body (JSON)**:
  * `name` (string, required)
  * `category` (string, required) - e.g. "Hulu", "Tengah", "Hilir"
  * `type` (string, required) - e.g. "Gerobak", "Mobet", "Truk"
  * `capacity` (string, required)
  * `total_units` (int, required)

### GET `/fleets/{id}`
* **Deskripsi**: Mengambil detail informasi armada berdasarkan ID.
* **Auth**: Bearer Token

### PUT `/fleets/{id}`
* **Deskripsi**: Memperbarui informasi data armada kendaraan.
* **Auth**: Bearer Token

### DELETE `/fleets/{id}`
* **Deskripsi**: Menghapus tipe armada kendaraan dari sistem.
* **Auth**: Bearer Token

---

## 🔌 10. WebSocket Telemetri Real-time (WebSockets)

### WS `/ws/sensor` (WebSocket Connection Channel)
* **Deskripsi**: Saluran komunikasi dua arah (*two-way persistent channel*) untuk memantau data sensor secara real-time. Dasbor frontend (React) membuka koneksi ke endpoint ini untuk menghindari beban polling HTTP berulang kali.
* **Prefix URL**: `ws://<backend_host>/api/v1/ws/sensor`
* **Format Pesan**: JSON
* **Aksi Client**: Direkomendasikan mengirimkan text heartbeat secara berkala untuk menjaga sambungan tetap terbuka.
* **Format Siaran Server (Broadcast Payload)**:
  Pesan dikirim otomatis dari backend saat ada data sensor telemetri baru masuk dari IoT:
  ```json
  {
    "event": "sensor_update",
    "data": {
      "id": 2618,
      "zone_id": 1,
      "sensor_type": "Ultrasonic-Organic",
      "fill_percentage": 82.5,
      "value": 17.5,
      "created_at": "2026-07-10T16:18:44.049701",
      "updated_at": "2026-07-10T16:18:44.049701",
      "zone_risk_status": "High Priority"
    }
  }
  ```
