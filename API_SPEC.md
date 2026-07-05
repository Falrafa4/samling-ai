# 📖 Samling AI - API Specification (Spesifikasi Endpoint)

Dokumen ini menyediakan spesifikasi lengkap seluruh endpoint API yang tersedia pada sistem **Samling AI** untuk dikonsumsi oleh tim Frontend (React), Tim Chatbot (Node.js), dan Tim IoT/AI.

---

## 🔒 Format Umum & Autentikasi

### Base URL
* Local Development: `http://localhost:8000/api/v1`

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
* **Deskripsi**: Mengautentikasi khusus administrator menggunakan format input Form Data.
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
        "name": "TPS 01 - Kebon Jeruk",
        "latitude": -6.1944,
        "longitude": 106.7672,
        "risk_status": "High Priority"
      }
    ]
  }
  ```

---

## 🚚 3. Supir Armada (Drivers)

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
        "zone_id": 1,
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
  * `name` (string, min_length=2)
  * `whatsapp_number` (string, format standard: e.g. "6281234567890")
  * `zone_id` (int, required)
  * `username` (string, optional - default: `whatsapp_number`)
  * `password` (string, optional - default: `"driver123"`)
* **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Driver baru berhasil didaftarkan.",
    "data": {
      "id": 6,
      "name": "Eko Prasetyo",
      "username": "6281299990000",
      "whatsapp_number": "6281299990000",
      "zone_id": 1,
      "status": "Offline",
      "role": "driver",
      "created_at": "2026-07-05T06:50:00"
    }
  }
  ```

### PUT `/drivers/{id}`
* **Deskripsi**: Memperbarui informasi profil atau status supir secara dinamis.
* **Auth**: Bearer Token
* **Path Parameters**:
  * `id` (int, required) - ID Driver (User)
* **Request Body (JSON)**:
  * `name` (string, optional)
  * `whatsapp_number` (string, optional)
  * `zone_id` (int, optional)
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
      "zone_id": 1,
      "status": "Available",
      "role": "driver",
      "created_at": "2026-07-05T05:20:21"
    }
  }
  ```

### DELETE `/drivers/{id}`
* **Deskripsi**: Menghapus data driver dari database.
* **Auth**: Bearer Token
* **Path Parameters**:
  * `id` (int, required)

---

## 📡 4. Data Sensor IoT (Sensor Data)

### POST `/sensor-data`
* **Deskripsi**: Menerima data pembacaan telemetri dari perangkat keras IoT ESP32 secara publik.
* **Auth**: Public
* **Request Body (JSON)**:
  * `zone_id` (int, required)
  * `sensor_type` (string, required) - e.g. "Ultrasonic", "Infrared"
  * `fill_percentage` (float, required) - 0.0 sampai 100.0
  * `value` (float, required) - Nilai pembacaan mentah (jarak cm)
* **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Data sensor berhasil disimpan dan status wilayah berhasil diperbarui.",
    "data": {
      "id": 16,
      "zone_id": 1,
      "sensor_type": "Ultrasonic",
      "fill_percentage": 85.0,
      "value": 15.0,
      "created_at": "2026-07-05T06:55:00"
    }
  }
  ```

### GET `/sensor-data/latest`
* **Deskripsi**: Mengambil pembacaan data sensor terakhir per wilayah TPS (Max 1 record terbaru per zone).
* **Auth**: Bearer Token
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Data sensor terbaru per wilayah berhasil diambil.",
    "data": [
      {
        "id": 16,
        "zone_id": 1,
        "sensor_type": "Ultrasonic",
        "fill_percentage": 85.0,
        "value": 15.0,
        "created_at": "2026-07-05T06:55:00",
        "zone": {
          "id": 1,
          "name": "TPS 01 - Kebon Jeruk",
          "latitude": -6.1944,
          "longitude": 106.7672,
          "risk_status": "High Priority"
        }
      }
    ]
  }
  ```

### GET `/sensor-data/history`
* **Deskripsi**: Mengambil data telemetri historis untuk wilayah tertentu yang digunakan oleh model AI Amadeus.
* **Auth**: Public / Internal AI
* **Query Parameters**:
  * `zone_id` (int, required)
  * `days` (int, optional - default: 7) - Jangkauan hari ke belakang
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Data historis sensor berhasil diambil.",
    "data": [
      {
        "id": 14,
        "zone_id": 1,
        "sensor_type": "Ultrasonic",
        "fill_percentage": 65.0,
        "value": 35.0,
        "created_at": "2026-07-05T01:20:00"
      },
      {
        "id": 16,
        "zone_id": 1,
        "sensor_type": "Ultrasonic",
        "fill_percentage": 85.0,
        "value": 15.0,
        "created_at": "2026-07-05T06:55:00"
      }
    ]
  }
  ```

---

## 🔮 5. Prediksi Volume Sampah AI (Volume Predictions)

### POST `/volume-predictions`
* **Deskripsi**: Mengirimkan data prediksi volume sampah di masa depan yang dihasilkan oleh AI Amadeus.
* **Auth**: Public / Internal AI
* **Request Body (JSON)**:
  * `zone_id` (int, required)
  * `predicted_volume` (float, required) - Prediksi kapasitas volume sampah
  * `confidence_score` (float, required) - Tingkat akurasi (0.0 sampai 1.0)
  * `target_time` (string, format ISO datetime) - Waktu sasaran prediksi di masa depan
* **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Hasil prediksi AI berhasil disimpan.",
    "data": {
      "id": 21,
      "zone_id": 1,
      "predicted_volume": 12.5,
      "confidence_score": 0.95,
      "target_time": "2026-07-07T05:20:14",
      "created_at": "2026-07-05T05:20:14"
    }
  }
  ```

### GET `/volume-predictions/{zone_id}/projections`
* **Deskripsi**: Mengambil data proyeksi volume sampah untuk 7 hari ke depan (diurutkan naik berdasarkan target waktu).
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
        "id": 21,
        "zone_id": 1,
        "predicted_volume": 12.5,
        "confidence_score": 0.95,
        "target_time": "2026-07-07T05:20:14",
        "created_at": "2026-07-05T05:20:14"
      }
    ]
  }
  ```

---

## 📢 6. Laporan Pengaduan Warga (Citizen Reports)

### GET `/citizen-reports`
* **Deskripsi**: Mengambil seluruh laporan warga untuk ditampilkan ke papan Kanban.
* **Auth**: Bearer Token
* **Query Parameters**:
  * `zone_id` (int, optional)
  * `status` (string, optional) - "Baru", "Sedang Ditangani", "Selesai"
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Daftar aduan berhasil diambil.",
    "data": [
      {
        "id": 1,
        "whatsapp_number": "6281234567890",
        "report_content": "Ada tumpukan sampah plastik menumpuk banyak di dekat gerbang TPS 01 Kebon Jeruk, tolong segera diangkut.",
        "zone_id": 1,
        "status": "Baru",
        "is_grouped": true,
        "created_at": "2026-07-05T01:20:00",
        "zone": {
          "id": 1,
          "name": "TPS 01 - Kebon Jeruk",
          "latitude": -6.1944,
          "longitude": 106.7672,
          "risk_status": "High Priority"
        }
      }
    ]
  }
  ```

### POST `/citizen-reports`
* **Deskripsi**: Menyimpan pengaduan baru secara manual melalui UI admin.
* **Auth**: Bearer Token
* **Request Body (JSON)**:
  * `whatsapp_number` (string, required)
  * `report_content` (string, required)
  * `zone_id` (int, required)

### PUT `/citizen-reports/{id}`
* **Deskripsi**: Mengubah status penanganan aduan (misal memindahkan kartu di Kanban).
* **Auth**: Bearer Token
* **Path Parameters**:
  * `id` (int, required)
* **Request Body (JSON)**:
  * `zone_id` (int, optional)
  * `status` (string, optional) - "Baru", "Sedang Ditangani", "Selesai"
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Laporan aduan warga berhasil diperbarui.",
    "data": {
      "id": 1,
      "whatsapp_number": "6281234567890",
      "report_content": "...",
      "zone_id": 1,
      "status": "Sedang Ditangani",
      "is_grouped": true,
      "created_at": "2026-07-05T01:20:00"
    }
  }
  ```

### POST `/webhook/whatsapp` (Webhook Chatbot Agung)
* **Deskripsi**: Endpoint publik untuk menyimpan pesan keluhan warga dari Chatbot WhatsApp dengan fitur deteksi duplikasi otomatis (kemiripan aduan > 60% dalam 12 jam terakhir).
* **Auth**: Public / Webhook
* **Request Body (JSON)**:
  * `whatsapp_number` (string, required)
  * `report_content` (string, required)
  * `zone_id` (int, required)
* **Success Response (`201 Created`)**:
  ```json
  {
    "status": "success",
    "message": "Report saved"
  }
  ```

---

## 🗺️ 7. Optimasi & Rekomendasi Rute Supir (Route Recommendations)

### POST `/route-recommendations`
* **Deskripsi**: Menyimpan susunan rute optimal yang telah dihitung oleh sistem.
* **Auth**: Bearer Token
* **Request Body (JSON)**:
  * `driver_id` (int, required)
  * `route_json` (string, format JSON Array berisi ID Zone) - e.g. `"[1, 3, 5, 2, 4]"`
* **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Rekomendasi rute baru berhasil disimpan.",
    "data": {
      "id": 1,
      "driver_id": 2,
      "route_json": "[1, 3, 5, 2, 4]",
      "status": "Pending",
      "created_at": "2026-07-05T05:20:21",
      "updated_at": "2026-07-05T05:20:21",
      "driver": {
        "id": 2,
        "name": "Budi Utomo",
        "username": "driver_budi",
        "whatsapp_number": "6281234567890",
        "zone_id": 1,
        "status": "Offline",
        "role": "driver",
        "created_at": "2026-07-05T05:20:21"
      }
    }
  }
  ```

### GET `/route-recommendations/latest`
* **Deskripsi**: Mengambil rekomendasi rute optimal terbaru.
* **Auth**: Bearer Token

### GET `/route-recommendations/driver/{driver_id}` (Rute Aktif Driver)
* **Deskripsi**: Mengambil rute pengangkutan sampah aktif (berstatus `'Pending'` atau `'In Progress'`) milik supir terkait.
* **Auth**: Bearer Token
* **Path Parameters**:
  * `driver_id` (int, required)
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Daftar rute driver berhasil diambil.",
    "data": [
      {
        "id": 1,
        "driver_id": 2,
        "route_json": "[1, 3, 5, 2, 4]",
        "status": "In Progress",
        "created_at": "2026-07-05T05:20:21",
        "updated_at": "2026-07-05T06:30:00"
      }
    ]
  }
  ```

### POST `/route-recommendations/dispatch/{driver_id}` (Dispatch WA)
* **Deskripsi**: Mengirimkan rute terurut optimal ke driver via WhatsApp Gateway (simulasi) dan mengubah status rute menjadi `"In Progress"` serta status driver menjadi `"On Duty"`.
* **Auth**: Bearer Token
* **Path Parameters**:
  * `driver_id` (int, required)
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Manifes rute berhasil dikirim ke WhatsApp Supir Budi Utomo.",
    "data": {
      "driver_id": 2,
      "driver_name": "Budi Utomo",
      "whatsapp_number": "6281234567890",
      "message_body": "Halo *Budi Utomo*,\n\nBerikut adalah manifes rute tugas pengangkutan sampah optimal Anda...",
      "gmaps_url": "https://www.google.com/maps/dir/-6.1944,106.7672/-6.2084,106.7992/...",
      "route_status": "In Progress",
      "driver_status": "On Duty"
    }
  }
  ```

### PUT `/route-recommendations/{id}/status`
* **Deskripsi**: Memperbarui status penyelesaian rute tugas supir di lapangan. Jika diubah ke `"Completed"`, status driver otomatis diubah kembali menjadi `"Available"`.
* **Auth**: Bearer Token
* **Path Parameters**:
  * `id` (int, required) - ID Rute Rekomendasi
* **Request Body (JSON)**:
  * `status` (string, required) - "Pending", "In Progress", "Completed"
* **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Status rute berhasil diperbarui.",
    "data": {
      "id": 1,
      "driver_id": 2,
      "route_json": "[1, 3, 5, 2, 4]",
      "status": "Completed",
      "created_at": "2026-07-05T05:20:21",
      "updated_at": "2026-07-05T06:40:00"
    }
  }
  ```

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
