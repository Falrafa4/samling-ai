# **SYSTEM USER INTERFACE & PAGE SPECIFICATION (ADMIN ROLE)**

Dokumen ini menjelaskan detail struktur komponen, fungsionalitas inti, serta fitur pendukung kenyamanan (*usability*) pada setiap halaman untuk **Role: Administrator** setelah disesuaikan dengan ekosistem pelaporan asinkron berbasis WhatsApp.

## **5.1 Halaman: Overview (Dashboard Utama)**

* **Objektif Halaman:** Memberikan ringkasan situasi darurat, status kapasitas, dan prediksi lonjakan sampah di seluruh wilayah dalam waktu singkat (*high-level situational awareness*).

### **A. Tata Letak & Tata Ruang (Layout Grid)**

* **Grid:** 12-Column Desktop Grid.  
* **Komposisi:** Top Banner (Full Width) ➔ KPI Cards Grid (4 Kolom per Card) ➔ 2-Column Split (Kiri 8 Kolom: Grafik AI; Kanan 4 Kolom: Aktivitas Terbaru).

### **B. Matriks Spesifikasi Komponen & Fitur**

| Nama Komponen | Tipe Fitur | Deskripsi Fungsionalitas | Indikator UX / State |
| :---- | :---- | :---- | :---- |
| **Contextual Alert Banner** | Core Feature | Spanduk dinamis di paling atas halaman untuk menampilkan anomali eksternal (cuaca ekstrem/event lokal) berdasarkan prediksi AI. | Warna background otomatis menyesuaikan tingkat risiko terparah hari itu. |
| **KPI Metrics Cards** | Core Feature | Menampilkan 3 metrik utama: Total Laporan Warga Aktif, Jumlah TPS Kritis, dan **Persentase Kesiapan Armada** (ter-update otomatis dari hasil konfirmasi pesan WhatsApp Driver). | *Hover State:* Card naik 2px dengan bayangan halus, dapat diklik untuk *drill-down* ke halaman detail. |
| **AI Surge Prediction Graph** | Core Feature | Grafik garis (*line chart*) interaktif memproyeksikan estimasi volume sampah 7 hari ke depan dengan memadukan data historis dan kalender event. | *Tooltip State:* Mengarahkan kursor ke titik grafik menampilkan persentase keyakinan model (*AI confidence score*). |
| **Global Date Filter** | Supporting | Filter waktu cepat berbentuk tombol *chip* (Hari Ini, Besok, 7 Hari). | *Active State:* Background menggunakan warna Primary Light (\#E6F4EA). |
| **Export Report Button** | Supporting | Tombol untuk mengunduh kompilasi data ringkasan dalam format PDF/Excel untuk kebutuhan birokrasi DLH. | Menyediakan *Loading State* berupa animasi spinner saat dokumen sedang digenerasikan. |

**💡 Catatan UX Overview:** Halaman ini dilarang menggunakan scroll vertikal yang terlalu panjang. Semua informasi penting harus muat dalam satu layar monitor standar (*above the fold*).

## **5.2 Halaman: Predictive Map (Peta Pemantauan)**

* **Objektif Halaman:** Visualisasi spasial interaktif untuk memetakan titik-titik TPS dan sebaran wilayah prioritas berdasarkan tingkat risiko kelebihan muatan hasil kalkulasi AI.

### **A. Tata Letak & Tata Ruang (Layout Grid)**

* **Grid:** Full-screen Fluid Canvas.  
* **Komposisi:** Sidebar Menu (Fixed 260px) ➔ Map Area (Sisa Lebar Layar) ➔ Floating Overlay Panel di sisi kiri dan kanan peta.

### **B. Matriks Spesifikasi Komponen & Fitur**

| Nama Komponen | Tipe Fitur | Deskripsi Fungsionalitas | Indikator UX / State |
| :---- | :---- | :---- | :---- |
| **Interactive Map Nodes** | Core Feature | Penanda lokasi (*pins*) seluruh TPS di peta kota dengan pewarnaan semantik berdasarkan klasifikasi AI (Normal, Warning, High Priority). | *Pulse Animation:* Khusus untuk node berstatus High Priority (Merah), ikon berkedip perlahan untuk menarik perhatian admin. |
| **Hybrid Light Indicator** | Core Feature | Label pembeda pada node peta untuk menegaskan sumber data: apakah berasal dari Sensor IoT langsung atau hasil kalkulasi Prediksi AI. | Menggunakan sistem *Icon Badge* kecil di pojok kanan atas pin lokasi. |
| **Task Completion Overlay** | Core Feature | Visualisasi berupa ikon centang hijau pada pin lokasi jika Driver telah menekan tombol \[SELESAI DIANGKUT\] di WhatsApp Chatbot dan mengunggah foto bukti bersih. | Node lokasi otomatis berubah transparan sebesar 40% setelah tugas divalidasi selesai, menandakan mitigasi area keramaian telah berhasil. |
| **Map Layer Toggles** | Supporting | *Floating checkbox* menu untuk memfilter visualisasi apa saja yang ingin ditampilkan di atas peta (misal: menyembunyikan area normal). | Elemen peta langsung menyembur (*fade-out*) atau muncul (*fade-in*) tanpa *reload* halaman. |
| **Smart Hover Tooltips** | Supporting | Jendela informasi instan yang muncul saat kursor diarahkan ke salah satu pin TPS tanpa perlu diklik. | Menampilkan: Nama TPS, Kapasitas Saat Ini (%), Nama Driver Ditugaskan, dan Status Respon WhatsApp Driver (Siap/Kendala/Pending). |
| **Recenter Button** | Supporting | Tombol mengambang berlambang target (🎯) untuk mengembalikan fokus kamera peta ke pusat wilayah operasional. | *Interaction:* Efek transisi pergeseran peta yang mulus (*smooth panning animation*). |

## **5.3 Halaman: Fleet & WhatsApp Dispatch (Manajemen Rute & Driver)**

* **Objektif Halaman:** Mengoptimasi penugasan rute prioritas hasil prediksi AI dan memantau status interaksi asinkron Driver melalui platform WhatsApp Chatbot.

### **A. Tata Letak & Tata Ruang (Layout Grid)**

* **Grid:** 12-Column Desktop Grid.  
* **Komposisi:** Kiri (7 Kolom: Peta Pratinjau Jalur Statis & Rekomendasi Rute) ➔ Kanan (5 Kolom: Panel Status Respon Driver WA & Modul Eksekusi Penugasan).

### **B. Matriks Spesifikasi Komponen & Fitur**

| Nama Komponen | Tipe Fitur | Deskripsi Fungsionalitas | Indikator UX / State |
| :---- | :---- | :---- | :---- |
| **Dynamic Route Generator** | Core Feature | Modul algoritma yang menampilkan urutan jalan/TPS terbaik berdasarkan efisiensi jarak dan tingkat urgensi wilayah. | Menampilkan garis jalur berwarna hijau tebal di atas peta dengan panah penunjuk rute statis yang siap dikonversi menjadi tautan Google Maps. |
| **Driver Readiness Tracker Panel** | Core Feature | Panel daftar nama driver beserta indikator status respon aktual mereka terhadap pesan konfirmasi tugas dari sistem (Belum Merespon, Siap Bertugas, Ada Kendala). | *Color Coding State:* Abu-abu (Belum merespon), Hijau (Siap), Merah (Ada Kendala \- Butuh alokasi rute ulang segera). |
| **Send Route via WhatsApp CTA** | Core Feature | Tombol eksekusi final untuk mengirimkan teks manifes rute jalan dan tautan peta statis langsung ke API WhatsApp nomor supir yang dipilih. | Berubah menjadi *Disabled State* (Abu-abu) disertai label *"Terkirim \- Menunggu Konfirmasi Driver"* setelah ditekan guna mencegah pengiriman ganda. |
| **Reassignment Quick-Dropdown** | Supporting | Dropdown cepat untuk mengalihkan rute rekomendasi AI ke driver cadangan apabila driver utama menekan tombol \[ADA KENDALA\] di WhatsApp mereka. | *Interaction Effect:* Baris nama driver yang bermasalah otomatis berkedip merah lembut sebelum admin melakukan alokasi ulang. |
| **Route Proof Viewer Card** | Supporting | Komponen kartu mini di bawah daftar driver yang berfungsi untuk meninjau (*review*) foto bukti TPS bersih yang dikirim driver via kamera WhatsApp. | *Click State:* Membuka media viewer untuk melihat foto resolusi penuh sebagai dokumen validasi harian sebelum diarsipkan. |

## **5.4 Halaman: Citizen Reports (Pusat Laporan WhatsApp Warga)**

* **Objektif Halaman:** Mengelola, memvalidasi, dan merespons tumpukan laporan masalah sampah yang dikirimkan oleh masyarakat melalui WhatsApp Chatbot (sebagai data tambahan model prediksi AI).

### **A. Tata Letak & Tata Ruang (Layout Grid)**

* **Grid:** 12-Column Desktop Grid (Tampilan Kanban) atau Tabel Responsif.  
* **Komposisi:** Top Filter Bar ➔ 3-Column Kanban Board Layout (Laporan Baru, Sedang Ditangani, Selesai).

### **B. Matriks Spesifikasi Komponen & Fitur**

| Nama Komponen | Tipe Fitur | Deskripsi Fungsionalitas | Indikator UX / State |
| :---- | :---- | :---- | :---- |
| **Live Report Feed Cards** | Core Feature | Kartu informasi berisi ringkasan laporan warga yang dikirim dari WhatsApp (Nama, Foto Kondisi, Koordinat Lokasi). | Laporan baru yang belum dibaca admin ditandai dengan titik merah (*Unread Dot Indication*) di pojok kartu. |
| **AI Duplicate Grouping** | Core Feature | Sistem otomatis mengelompokkan laporan-laporan dari warga berbeda jika berada dalam radius lokasi berdekatan (\< 50 meter). | Menampilkan teks indikator: *“+3 Laporan Serupa”*. Kartu dapat di-ekspand untuk melihat detail pelapor lainnya. |
| **Image Lightbox & Zoom** | Supporting | Fitur untuk memperbesar foto bukti tumpukan sampah yang dikirim warga dalam ukuran penuh saat gambar diklik. | Latar belakang halaman otomatis menjadi gelap (*Overlay Opacity 80%*) dengan kontrol navigasi tutup (X). |
| **Quick Reply Templates** | Supporting | Tombol makro berisi draf pesan balasan otomatis untuk dikirimkan kembali ke WhatsApp warga (misal: menginfokan rute truk sudah jalan). | Cukup satu klik untuk memicu pengiriman pesan via WhatsApp Gateway API. |

## **5.5 Edge Cases & Exception Handling (Kondisi Khusus & Penanganan Eror)**

* **Objektif:** Menjamin antarmuka dashboard tetap informatif, tidak membingungkan admin, dan menyediakan solusi alternatif (*graceful degradation*) ketika terjadi kendala respon lapangan pada sisi driver maupun kegagalan teknis pihak ketiga.

### **A. Komponen Empty States (Kondisi Nihil Data)**

Digunakan saat tidak ada aktivitas data dinamis atau respon yang masuk ke dalam sistem.

| Nama Komponen / Halaman | Kondisi Pemicu | Deskripsi Fungsionalitas | Indikator Visual & Copywriting |
| :---- | :---- | :---- | :---- |
| **Citizen Reports Empty State** | Tidak ada laporan tumpukan sampah yang dikirim warga via WhatsApp pada hari tersebut. | Menggantikan halaman kosong/putih dengan ilustrasi visual yang menenangkan agar admin tahu sistem tidak eror, melainkan memang bersih. | **Visual:** Ilustrasi maskot SAMLING AI sedang menyapu dengan latar bersih. **Copy:** *"Semua Lingkungan Aman\! Hari ini belum ada laporan penumpukan sampah dari warga."* |
| **Driver Response Zero State** | Seluruh Driver yang dijadwalkan telah merespon tombol WhatsApp dengan status \[SIAP BERTUGAS\]. | Mengubah daftar panel pemantauan respon yang biasanya penuh menjadi area bersih yang menandakan seluruh kesiapan armada telah aman. | **Visual:** Ikon truk centang hijau besar dengan animasi *check-mark* halus. **Copy:** *"Logistik Siap\! 100% Driver telah mengonfirmasi kesiapan armada untuk rute prediksi hari ini."* |

### **B. Komponen Error States (Kondisi Kegagalan Perangkat & Respon Driver)**

Digunakan untuk mengantisipasi masalah pada perangkat keras, jaringan gateway, maupun kendala komunikasi dari supir di lapangan.

| Nama Komponen / Halaman | Kondisi Pemicu | Deskripsi Fungsionalitas | Indikator Visual & Copywriting |
| :---- | :---- | :---- | :---- |
| **IoT Sensor Disconnect Node** | Perangkat keras sensor IoT di TPS terpilih mendadak kehilangan sinyal/kehabisan baterai. | Node lokasi di peta tidak boleh menampilkan warna status risiko (*Normal/Warning/High*), melainkan status *Offline* agar tidak terjadi salah diagnosis data. | **Visual:** Node berubah warna menjadi Abu-abu Slate (\#94A3B8) dengan garis tepi putus-putus (*dashed*) dan ikon wifi-off. **Tooltip:** *"Koneksi IoT Terputus. Menampilkan data estimasi historis."* |
| **AI Prediction Model Timeout** | Server atau API algoritma peramalan volume sampah mengalami *down* atau *request timeout*. | Grafik prediksi 7 hari ke depan tidak boleh rusak atau kosong. Sistem otomatis beralih menampilkan data rata-rata historis konvensional. | **Visual:** Muncul *floating toast notification* warna kuning di pojok grafik. **Copy:** *“⚠️ Gagal memuat prediksi AI terbaru. Sistem menampilkan data rata-rata historis sebagai alternatif.”* |
| **Driver WA Response Timeout Alert** | Driver tidak menekan tombol konfirmasi rute di WhatsApp dalam waktu 30 menit sejak pesan dikirim. | Baris nama driver di halaman *Fleet & Dispatch* berubah warna untuk mendesak admin segera melakukan tindakan panggilan manual. | **Visual:** Baris list berkedip warna Kuning Amber (\#F59E0B) dengan ikon tanda seru penunjuk waktu (*timer-alert*). **Copy:** *"⚠️ Driver Belum Merespon WA (30 Menit+). Harap hubungi via telepon."* |
| **Driver Flagged Constraint (Ada Kendala)** | Driver menekan tombol \[ADA KENDALA\] (Truk rusak/Sakit) pada antarmuka WhatsApp mereka. | Sistem otomatis memicu alarm visual di Dashboard Admin agar admin segera mengalokasikan ulang rute prediksi tersebut. | **Visual:** Banner pop-up kecil (*Toast Notification*) warna merah menyala di pojok kanan atas layar disertai suara peringatan *soft-ding*. **Copy:** *"🚨 Pak Joko melaporkan kendala armada via WhatsApp. Segera alokasikan rute TPS Alun-Alun ke driver lain."* |
| **WhatsApp Gateway Failure** | Layanan pihak ketiga WhatsApp API mengalami gangguan transmisi sehingga laporan tidak bisa masuk/keluar. | Memberikan peringatan instan kepada admin pada halaman *Live Report Feed* agar mereka beralih ke jalur komunikasi radio/telepon manual. | **Visual:** Banner merah statis di atas tabel laporan warga. **Copy:** *“🔴 Koneksi WhatsApp Chatbot terganggu. Validasi laporan warga dialihkan ke input manual sementara waktu.”* |

