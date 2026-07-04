# 🔌 Rencana Implementasi & Spesifikasi REST API Backend

Dokumen ini mendefinisikan rancangan arsitektur, spesifikasi endpoint, Pydantic schemas, serta logika bisnis untuk seluruh modul backend FastAPI di dalam proyek **Samling AI** (mengacu pada model di [backend/app/models](file:///home/naufal/Documents/my-projects/samling-ai/backend/app/models)). 

API untuk entitas **Zones** yang telah dikembangkan sebelumnya digunakan sebagai standar dan acuan utama dalam perancangan dokumen ini.

---

## 🛠️ 1. Standar Desain REST API & Konvensi
Untuk memastikan backend scalable dan mudah diintegrasikan dengan React frontend, kita menerapkan standar RESTful berikut:
*   **Base URL**: Semua endpoint modular dikelompokkan dengan prefix `/api/v1`.
*  **Struktur Response Success**: Menggunakan format JSON konsisten:
    ```json
    {
      "success": true,
      "message": "Deskripsi singkat",
      "data": { ... }
    }
    ```
*   **Struktur Response Error**: Menggunakan status code HTTP semantik disertai detail pesan error JSON:
    ```json
    {
        "success": false, 
        "message": "Pesan deskripsi error yang jelas untuk frontend" }
    ```
*   **Pydantic Config**: Menggunakan `from_attributes = True` (Pydantic V2) atau `orm_mode = True` untuk parsing model SQLAlchemy secara otomatis.
*   **Validasi Masukan**: Seluruh data masuk (Request Body) wajib divalidasi tipe data dan batasannya menggunakan constraint Pydantic (seperti `Field` atau `validator`).

---

## 📂 2. Spesifikasi Endpoint per Entitas

### A. Autentikasi & Pengguna (`/api/v1/auth` & `/api/v1/users`)
Menangani login admin dan manajemen pengguna.

#### 1. Pydantic Schemas (`app/schemas/users.py`)
```python
from pydantic import BaseModel, Field
from typing import Optional

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    role: Optional[str] = "admin"

class UserResponse(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True  # Mendukung konversi otomatis dari SQLAlchemy
```

#### 2. REST Endpoints
*   **`POST /api/v1/auth/login` (Login Admin)**
    *   **Deskripsi**: Mengautentikasi kredensial pengguna dan mengembalikan data user serta token.
    *   **Request Body**: `LoginRequest` (`username`, `password`)
    *   **Success (200 OK)**:
        ```json
        {
          "message": "Login berhasil!",
          "access_token": "jwt_token_here",
          "token_type": "bearer",
          "user": { "id": 1, "username": "admin_samling", "role": "admin" }
        }
        ```
    *   **Error (401 Unauthorized)**: Username atau password salah.
*   **`POST /api/v1/users` (Buat Admin Baru)**
    *   **Deskripsi**: Mendaftarkan admin baru (hanya dapat dipanggil jika admin lama terautentikasi).
    *   **Request Body**: `UserCreate`
    *   **Success (210 Created)**: `UserResponse`
    *   **Error (400 Bad Request)**: Username sudah terdaftar.

---

### B. Supir Armada (`/api/v1/drivers`)
Mengelola data supir pengangkut sampah dan relasi wilayah tugas mereka.

#### 1. Pydantic Schemas (`app/schemas/drivers.py`)
```python
from pydantic import BaseModel, Field
from typing import Optional

class DriverCreate(BaseModel):
    name: str = Field(..., min_length=2)
    whatsapp_number: str = Field(..., pattern=r"^62\d{9,13}$")  # Format standar WA Indonesia
    zone_id: int

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    whatsapp_number: Optional[str] = Field(None, pattern=r"^62\d{9,13}$")
    zone_id: Optional[int] = None

class DriverResponse(BaseModel):
    id: int
    name: str
    whatsapp_number: str
    zone_id: int

    class Config:
        from_attributes = True
```

#### 2. REST Endpoints
*   **`GET /api/v1/drivers` (List Semua Driver)**
    *   **Success (200 OK)**: `List[DriverResponse]`
*   **`GET /api/v1/drivers/{id}` (Detail Driver)**
    *   **Success (200 OK)**: `DriverResponse`
    *   **Error (404 Not Found)**: Driver tidak ditemukan.
*   **`POST /api/v1/drivers` (Tambah Driver Baru)**
    *   **Request Body**: `DriverCreate`
    *   **Logika Validasi**: Sistem wajib mengecek apakah `zone_id` yang dimasukkan benar-benar ada di tabel `zones`. Jika tidak ada, kembalikan HTTP `400 Bad Request`.
    *   **Success (201 Created)**: `DriverResponse`
*   **`PUT /api/v1/drivers/{id}` (Update Data Driver)**
    *   **Request Body**: `DriverUpdate`
    *   **Success (200 OK)**: `DriverResponse`
*   **`DELETE /api/v1/drivers/{id}` (Hapus Driver)**
    *   **Success (200 OK)**: `{ "message": "Driver berhasil dihapus" }`

---

### C. Data Sensor IoT (`/api/v1/sensor-data`)
Menerima input telemetri dari sensor tingkat kepenuhan bak sampah di TPS.

#### 1. Pydantic Schemas (`app/schemas/sensor_data.py`)
```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class SensorDataCreate(BaseModel):
    zone_id: int
    sensor_type: str = Field(..., description="Contoh: Ultrasonic, Infrared")
    fill_percentage: float = Field(..., ge=0.0, le=100.0) # Harus di rentang 0-100%
    value: float

class SensorDataResponse(BaseModel):
    id: int
    zone_id: int
    sensor_type: str
    fill_percentage: float
    value: float
    created_at: datetime

    class Config:
        from_attributes = True
```

#### 2. REST Endpoints
*   **`POST /api/v1/sensor-data` (Kirim Data Sensor Baru)**
    *   **Deskripsi**: Digunakan oleh mikrokontroler IoT untuk mengirim data telemetri aktual.
    *   **Request Body**: `SensorDataCreate`
    *   **Logika Bisnis**: Setelah data sensor disimpan, sistem harus mengecek jika `fill_percentage` melebihi batasan kritis (misal > 80%). Jika ya, sistem secara otomatis memperbarui status `risk_status` wilayah terkait di tabel `zones` menjadi `"Warning"` atau `"High Priority"`.
    *   **Success (201 Created)**: `SensorDataResponse`
*   **`GET /api/v1/sensor-data/latest` (Data Sensor Terbaru)**
    *   **Deskripsi**: Mengambil pembacaan data sensor terakhir untuk semua wilayah TPS (dipakai untuk visualisasi Peta).
    *   **Success (200 OK)**: `List[SensorDataResponse]`

---

### D. Prediksi Volume Sampah AI (`/api/v1/volume-predictions`)
Menyimpan dan menyajikan data proyeksi volume sampah dari model AI.

#### 1. Pydantic Schemas (`app/schemas/volume_predictions.py`)
```python
from pydantic import BaseModel, Field
from datetime import datetime

class VolumePredictionCreate(BaseModel):
    zone_id: int
    predicted_volume: float
    target_time: datetime
    confidence_score: float = Field(..., ge=0.0, le=1.0) # Desimal 0.0 s.d 1.0

class VolumePredictionResponse(BaseModel):
    id: int
    zone_id: int
    predicted_volume: float
    target_time: datetime
    confidence_score: float
    created_at: datetime

    class Config:
        from_attributes = True
```

#### 2. REST Endpoints
*   **`POST /api/v1/volume-predictions` (Simpan Hasil Prediksi AI)**
    *   **Deskripsi**: Dipanggil oleh cron job/script engine AI di backend setelah kalkulasi selesai.
    *   **Request Body**: `VolumePredictionCreate`
    *   **Success (201 Created)**: `VolumePredictionResponse`
*   **`GET /api/v1/volume-predictions/{zone_id}/projections` (Proyeksi 7 Hari)**
    *   **Deskripsi**: Mengambil data proyeksi volume sampah 7 hari ke depan untuk wilayah tertentu (untuk grafik Chart.js).
    *   **Success (200 OK)**: `List[VolumePredictionResponse]`

---

### E. Laporan Pengaduan Warga (`/api/v1/citizen-reports`)
Mengelola data aduan tumpukan sampah yang dikirim oleh warga melalui WhatsApp Chatbot.

#### 1. Pydantic Schemas (`app/schemas/citizen_reports.py`)
```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class CitizenReportCreate(BaseModel):
    whatsapp_number: str = Field(..., pattern=r"^62\d{9,13}$")
    report_content: str
    zone_id: int

class CitizenReportUpdate(BaseModel):
    zone_id: Optional[int] = None
    # Menambahkan status penanganan untuk tata letak Kanban Board
    status: Optional[str] = Field("Baru", description="Pilihan: Baru, Sedang Ditangani, Selesai")

class CitizenReportResponse(BaseModel):
    id: int
    whatsapp_number: str
    report_content: str
    zone_id: int
    created_at: datetime

    class Config:
        from_attributes = True
```

#### 2. REST Endpoints
*   **`POST /api/v1/citizen-reports` (Terima Laporan Baru)**
    *   **Deskripsi**: Dipicu oleh webhook integrasi WhatsApp Chatbot saat warga mengirim pesan aduan.
    *   **Request Body**: `CitizenReportCreate`
    *   **Logika Duplikasi**: Sebelum menyimpan laporan baru, sistem membandingkan jika ada laporan serupa dari koordinat/zona yang sama dalam kurun waktu 12 jam terakhir. Jika terdeteksi duplikat, tandai laporan tersebut sebagai laporan berkelompok (untuk fitur *AI Duplicate Grouping* di Frontend).
    *   **Success (201 Created)**: `CitizenReportResponse`
*   **`GET /api/v1/citizen-reports` (List Pengaduan Warga)**
    *   **Deskripsi**: Mendukung filter berdasarkan `zone_id` dan pengelompokan status untuk Kanban Board di Frontend.
    *   **Success (200 OK)**: `List[CitizenReportResponse]`

---

### F. Rekomendasi Rute Supir (`/api/v1/route-recommendations`)
Pusat pengaturan rute pengangkutan sampah optimal yang dihitung secara cerdas.

#### 1. Pydantic Schemas (`app/schemas/route_recommendations.py`)
```python
from pydantic import BaseModel
from datetime import datetime
from typing import List

class RouteRecommendationCreate(BaseModel):
    route_json: str  # Format JSON String berisi daftar ID zona terurut. Contoh: "[1, 3, 5]"

class RouteRecommendationResponse(BaseModel):
    id: int
    route_json: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

#### 2. REST Endpoints
*   **`POST /api/v1/route-recommendations` (Simpan Rekomendasi Rute Baru)**
    *   **Request Body**: `RouteRecommendationCreate`
    *   **Success (201 Created)**: `RouteRecommendationResponse`
*   **`GET /api/v1/route-recommendations/latest` (Ambil Rute Optimal Terkini)**
    *   **Success (200 OK)**: `RouteRecommendationResponse`
*   **`POST /api/v1/route-recommendations/dispatch/{driver_id}` (Kirim Manifes Tugas ke Driver via WA)**
    *   **Deskripsi**: Mengambil rute terbaru, lalu memicu pengiriman pesan WA Gateway ke driver berisi list TPS terurut dan peta rute.
    *   **Success (200 OK)**: `{ "status": "success", "message": "Manifes rute berhasil dikirim ke WhatsApp Supir." }`
    *   **Error (404 Not Found)**: Driver tidak ditemukan.

---

## 🔄 3. Penyelarasan & Refactoring Endpoint Eksisting

Berikut adalah rencana transisi untuk menyelaraskan endpoint lama yang saat ini masih berada langsung di root (`/zones` dan `/login`) ke prefix standar `/api/v1` sesuai *best practices*:

### A. Migrasi Endpoint `/login` ke `/api/v1/auth/login`
*   **Kondisi Saat Ini**: Route `/login` ditulis secara inline di dalam file [backend/app/main.py](file:///home/naufal/Documents/my-projects/samling-ai/backend/app/main.py#L23-L28).
*   **Strategi Refactoring**:
    1. Buat router autentikasi baru di `app/api/auth.py` dan pindahkan handler logic login dari `main.py` ke modul tersebut.
    2. Daftarkan login handler dengan path `/login` menggunakan `APIRouter`:
        ```python
        router = APIRouter(prefix="/auth", tags=["authentication"])
        
        @router.post("/login")
        def login(...):
            ...
        ```
    3. Hapus logic login dari `main.py`.

### B. Penyelarasan Endpoint `/zones` ke `/api/v1/zones`
*   **Kondisi Saat Ini**: Modul rute di [backend/app/api/zones.py](file:///home/naufal/Documents/my-projects/samling-ai/backend/app/api/zones.py) didefinisikan dengan `@router.get("/zones")` dan di-include di `main.py` secara langsung.
*   **Strategi Refactoring**:
    Ada dua metode efisien untuk melakukan sinkronisasi tanpa merombak semua baris dekorator di file `zones.py`:
    *   **Metode 1 (Rekomendasi - Sentralisasi di `main.py`)**: 
        Tambahkan parameter `prefix="/api/v1"` saat memanggil `include_router` di [backend/app/main.py](file:///home/naufal/Documents/my-projects/samling-ai/backend/app/main.py):
        ```python
        # Di main.py
        app.include_router(zones.router, prefix="/api/v1")
        ```
        *Ini otomatis mengubah rute `@router.get("/zones")` di zones.py menjadi `/api/v1/zones` secara transparan.*
    *   **Metode 2 (Pemisahan Rute di Modul)**:
        Ubah dekorator path di `zones.py` menjadi `@router.get("")` (relatif terhadap prefix) dan pasang prefix `/api/v1/zones` pada router:
        ```python
        router = APIRouter(prefix="/api/v1/zones", tags=["zones"])
        ```

### C. Penyelarasan Response Format
*   **Kondisi Saat Ini**: Beberapa endpoint masih mengembalikan response dalam format lama (misal: `{"detail": "..."}`) yang tidak konsisten dengan standar baru.
*   **Strategi Refactoring**:
    1. Buat utilitas helper `response_success` dan `response_error` di `app/utils/response.py` untuk membungkus response JSON sesuai format standar.
    2. Refactor seluruh endpoint untuk menggunakan helper ini, misal:
        ```python
        from app.utils.response import response_success, response_error
        @router.get("/zones")
        def get_zones(...):
            zones = db.query(Zone).all()
            return response_success(data=zones, message="List zona berhasil diambil.")
        ```

---

## 🔒 4. Hak Akses (Authentication & Security)
1. **Endpoint Publik**:
   * `POST /api/v1/auth/login` (Untuk otentikasi admin)
   * `POST /api/v1/sensor-data` (Untuk telemetri mikrokontroler IoT, disarankan menggunakan header API Key statis sederhana agar tidak bisa ditembak sembarangan).
2. **Endpoint Terproteksi (Butuh JWT Admin Token)**:
   * Seluruh API administrasi (`GET`, `POST`, `PUT`, `DELETE` untuk `/api/v1/zones`, `/api/v1/drivers`, `/api/v1/citizen-reports`, `/api/v1/route-recommendations`, `/api/v1/users`).
