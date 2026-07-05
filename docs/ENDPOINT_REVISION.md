### 🚀 Tabel Instruksi Endpoint Tambahan (Untuk AI Agent)

| Method | Endpoint | Integrasi Fitur | Input (Query / Body) | Logic & Action Database (Instruksi AI Agent) |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login/admin` | **Autentikasi JWT Role Admin** | **Form Data:**<br>- `username` (string)<br>- `password` (string) | Lakukan *query* ke tabel `users` untuk memverifikasi kombinasi `username` dan `password` serta memeriksa apakah `role` pengguna adalah 'admin'. Jika valid, buat JWT Token yang memuat `role` pengguna. Kembalikan token dalam format JSON. |
| `POST` | `/api/v1/auth/login/driver` | **Autentikasi JWT Role Driver** | **Form Data:**<br>- `username` (string)<br>- `password` (string) | Lakukan *query* ke tabel `users` untuk memverifikasi kombinasi `username` dan `password` serta memeriksa apakah `role` pengguna adalah 'driver'. Jika valid, buat JWT Token yang memuat `role` pengguna. Kembalikan token dalam format JSON. |
| `GET` | `/api/v1/sensor-data/history` | **AI Forecasting** | **Query Params:**<br>- `zone_id` (int)<br>- `days` (int, default=7) | Lakukan *query* ke tabel `sensor_data` berdasarkan `zone_id` dengan filter `created_at` dalam rentang waktu `days` ke belakang. Kembalikan data dalam format *list* berurutan (*time-series*) agar siap dikonsumsi model peramalan Amadeus. |
| `POST` | `/api/v1/webhook/whatsapp` | **WhatsApp Chatbot** | **JSON Body:**<br>- `whatsapp_number` (string)<br>- `report_content` (string) | Validasi *request body* menggunakan Pydantic. Buka sesi *Dependency Injection*, lalu lakukan *INSERT* ke tabel `citizen_reports`. Kembalikan respons berformat JSON sederhana seperti `{"status": "success", "message": "Report saved"}` agar Node.js Tim Chatbot Engineer tahu pesannya sudah diterima. |
| `GET` | `/api/v1/route-recommendations/driver/{driver_id}` | **Aplikasi Driver** | **Path Param:**<br>- `driver_id` (int) | Lakukan *query* ke tabel `route_recommendations` di mana `driver_id` cocok dengan parameter path. Ambil data dengan status *'Pending'* atau *'In Progress'* saja. Validasi terlebih dahulu apakah `driver_id` tersebut benar-benar ada di tabel `users` dan memiliki `role = 'driver'`. |
| `PUT` | `/api/v1/route-recommendations/{id}/status` | **Aplikasi Driver** | **Path Param:**<br>- `id` (int)<br><br>**JSON Body:**<br>- `status` (enum) | Lakukan *UPDATE* pada tabel `route_recommendations` berdasarkan `id` rute. Ubah kolom `status` menjadi nilai baru (misal dari *'Pending'* ke *'Completed'*). Perbarui juga kolom `updated_at` dengan waktu saat *request* diterima. |
| `GET` | `/api/v1/dashboard/summary` | **Dashboard Admin** | *None* | Lakukan *query* agregasi (Makro Metrik): hitung total `zones` berstatus *'Warning'* atau *'High Priority'*, hitung rata-rata `fill_percentage` terbaru dari `sensor_data`, dan hitung total baris di `citizen_reports`. Kembalikan dalam satu struktur JSON tunggal agar *loading* dasbor React sangat cepat. |

---

### 💡 Catatan Prompt Tambahan untuk AI Agent-mu

Saat menyalin tabel di atas ke AI Agent, tambahkan perintah (*prompt*) berikut agar kodenya semakin sempurna:

> *"Gunakan tabel endpoint di atas untuk meng-generate kode FastAPI (APIRouter). Pastikan kamu menggunakan **SQLAlchemy/SQLModel** untuk logic transaction-nya, dan buatkan skema **Pydantic**-nya untuk setiap validasi Request/Response. Gunakan pendekatan modul yang rapi dan terapkan Dependency Injection (Depends) untuk koneksi database."*

Dengan tabel dan instruksi ini, AI Agent-mu akan langsung memahami konteks relasi database terbarumu (seperti penggunaan `users.id` untuk driver) dan mengeksekusi kode *backend* MVP SAMLING AI dengan tingkat akurasi tinggi.