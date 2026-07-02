/**
 * Mock Data for Samling Frontend
 */

export const VALID_CREDENTIALS = [
    { email: 'admin@admin.com', username: 'admin', password: 'admin', displayName: 'admin' },
    { email: 'mici@admin.com', username: 'mici', password: 'mici', displayName: 'mici fomo' },
    { email: '1@1.com', username: '1', password: '1', displayName: '1' }
];

export const defaultPartners = [
    { id: 1, name: "GreenCompost Sidoarjo", desc: "Penyedia solusi pengomposan lokal", category: "organik", req: "500 kg/minggu", distance: 2.3, icon: "fa-leaf", phone: "859195391196", verified: true, lat: -7.4478, lng: 112.7183 },
    { id: 2, name: "EcoFarm Waru", desc: "Solusi pupuk & pertanian skala menengah", category: "organik", req: "800 kg/minggu", distance: 4.1, icon: "fa-seedling", phone: "85606671065", verified: false, lat: -7.3787, lng: 112.7376 },
    { id: 3, name: "BioEnergy Candi", desc: "Produksi biogas & energi terbarukan", category: "non-organik", req: "1000 kg/minggu", distance: 6.5, icon: "fa-industry", phone: "859195391196", verified: true, lat: -7.4892, lng: 112.7124 },
    { id: 4, name: "Urban Farming Porong", desc: "Pertanian urban & komunitas", category: "organik", req: "150 kg/minggu", distance: 1.8, icon: "fa-leaf", phone: "85606671065", verified: false, lat: -7.5328, lng: 112.6989 },
    { id: 5, name: "Plastik Reborn Krian", desc: "Daur ulang plastik menjadi bijih", category: "non-organik", req: "2000 kg/minggu", distance: 12.5, icon: "fa-bottle-water", phone: "812345678", verified: true, lat: -7.4082, lng: 112.5830 },
];

export const defaultTrucks = [
    {
        id: "T-01",
        name: "Truk A-01",
        driver: "Budi Santoso",
        plate: "AG 9021 XA",
        license_plate: "W 1234 AB",
        capacity: 2000, // in kg
        status: "available", // available, on_duty, maintenance
        eta: "5 min",
        rating: 4.8,
        distance_from_tps: 1.2
    },
    {
        id: "T-02",
        name: "Truk B-03",
        driver: "Asep Sunandar",
        plate: "N 1234 TF",
        license_plate: "W 5678 CD",
        capacity: 2500,
        status: "available",
        eta: "8 min",
        rating: 4.9,
        distance_from_tps: 2.5
    },
    {
        id: "T-03",
        name: "Truk C-02",
        driver: "Joko Anwar",
        plate: "L 5543 SS",
        license_plate: "W 9012 EF",
        capacity: 2000,
        status: "busy",
        eta: "15 min",
        rating: 4.5,
        distance_from_tps: 0.8
    },
    {
        id: "T-04",
        name: "Truk D-05",
        driver: "Rian Hidayat",
        plate: "AG 7788 KK",
        license_plate: "W 3456 GH",
        capacity: 3000,
        status: "available",
        eta: "18 min",
        rating: 4.7,
        distance_from_tps: 3.1
    }
];

export const defaultTps = [
    {
        id: 1,
        nama: "TPS Jambangan",
        lokasi: "Jl. Jambangan Kebon Agung",
        status: "Normal",
        jenis: "Organik & Non-Organik",
        kapasitas: 45,
        jarak: 120,
        city: "Surabaya",
        trend: [30, 35, 40, 38, 42, 44, 45]
    },
    {
        id: 2,
        nama: "TPS Keputih",
        lokasi: "Jl. Keputih Tegal",
        status: "Penuh",
        jenis: "B3 & Residu",
        kapasitas: 90,
        jarak: 450,
        city: "Surabaya",
        trend: [70, 75, 80, 85, 88, 89, 90]
    },
    {
        id: 3,
        nama: "TPS Bratang",
        lokasi: "Jl. Bratang Binangun",
        status: "Normal",
        jenis: "Organik",
        kapasitas: 20,
        jarak: 800,
        city: "Surabaya",
        trend: [10, 15, 12, 18, 20, 19, 20]
    },
    { 
        id: 4, 
        nama: "TPS Gadang", 
        lokasi: "Jl. Gadang",
        city: "Malang", 
        status: "Normal", 
        jenis: "Campuran", 
        kapasitas: 65, 
        jarak: 1200,
        trend: [50, 55, 60, 58, 62, 64, 65]
    },
    { 
        id: 5, 
        nama: "TPS Sukorame", 
        lokasi: "Jl. Sukorame",
        city: "Kediri", 
        status: "Penuh", 
        jenis: "Organik", 
        kapasitas: 88, 
        jarak: 2500,
        trend: [70, 75, 80, 82, 85, 87, 88]
    },
    { 
        id: 6, 
        nama: "TPS Karanglo", 
        lokasi: "Jl. Karanglo",
        city: "Blitar", 
        status: "Normal", 
        jenis: "Residu", 
        kapasitas: 30, 
        jarak: 3100,
        trend: [20, 22, 25, 24, 28, 29, 30]
    }
];

export const defaultTpa = [
    {
        id: 1,
        nama: "TPA Benowo",
        lokasi: "Jl. Raya Benowo, Surabaya",
        status: "Normal",
        jenis: "Pembangkit Listrik Tenaga Sampah",
        kapasitas: 60,
        jarak: 15000,
        city: "Surabaya",
        trend: [50, 55, 58, 56, 60, 61, 60],
        dailyVolume: 1600,
        lifespan: 10,
        wasteComposition: { organic: 55, nonOrganic: 35, b3: 10 }
    },
    {
        id: 2,
        nama: "TPA Supit Urang",
        lokasi: "Jl. Supit Urang, Malang",
        status: "Normal",
        jenis: "Sanitary Landfill",
        kapasitas: 55,
        jarak: 12000,
        city: "Malang",
        trend: [45, 48, 50, 52, 55, 54, 55],
        dailyVolume: 450,
        lifespan: 8,
        wasteComposition: { organic: 65, nonOrganic: 30, b3: 5 }
    },
    {
        id: 3,
        nama: "TPA Jabon",
        lokasi: "Jl. Raya Jabon, Sidoarjo",
        status: "Waspada",
        jenis: "Sanitary Landfill",
        kapasitas: 80,
        jarak: 25000,
        city: "Sidoarjo",
        trend: [70, 72, 75, 78, 77, 79, 80],
        dailyVolume: 800,
        lifespan: 3,
        wasteComposition: { organic: 40, nonOrganic: 45, b3: 15 }
    },
    {
        id: 4,
        nama: "TPA Griyo Mulyo",
        lokasi: "Jl. Griyo Mulyo, Gresik",
        status: "Normal",
        jenis: "Controlled Landfill",
        kapasitas: 40,
        jarak: 30000,
        city: "Gresik",
        trend: [30, 32, 35, 33, 38, 39, 40],
        dailyVolume: 350,
        lifespan: 15,
        wasteComposition: { organic: 60, nonOrganic: 35, b3: 5 }
    }
];

export const defaultTransactions = [
    {
        id: 1,
        nama: "Plastik Reborn Krian",
        tanggal: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), // Kemarin
        sampah: [
            { tipe: "Botol Plastik PET", berat: 150, kategori: "non-organik" },
            { tipe: "Gelas Plastik PP", berat: 75, kategori: "non-organik" }
        ]
    },
    {
        id: 2,
        nama: "GreenCompost Sidoarjo",
        tanggal: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), // 2 hari lalu
        sampah: [
            { tipe: "Sisa Makanan", berat: 300, kategori: "organik" },
        ]
    },
    {
        id: 3,
        nama: "BioEnergy Candi",
        tanggal: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString(), // 4 hari lalu
        sampah: [
            { tipe: "Limbah Organik Industri", berat: 500, kategori: "organik" },
            { tipe: "Jerami", berat: 120, kategori: "organik" }
        ]
    },
    {
        id: 4,
        nama: "Plastik Reborn Krian",
        tanggal: new Date(new Date().setDate(new Date().getDate() - 8)).toISOString(), // 8 hari lalu
        sampah: [
            { tipe: "Botol Plastik PET", berat: 180, kategori: "non-organik" },
        ]
    },
    {
        id: 5,
        nama: "Urban Farming Porong",
        tanggal: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(), // 10 hari lalu
        sampah: [
            { tipe: "Daun Kering", berat: 250, kategori: "organik" },
            { tipe: "Ranting", berat: 100, kategori: "organik" }
        ]
    },
    {
        id: 6,
        nama: "EcoFarm Waru",
        tanggal: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(), // 15 hari lalu
        sampah: [
            { tipe: "Kotoran Hewan", berat: 50, kategori: "organik" },
        ]
    },
    {
        id: 7,
        nama: "GreenCompost Sidoarjo",
        tanggal: new Date(new Date().setDate(new Date().getDate() - 25)).toISOString(), // 25 hari lalu
        sampah: [
            { tipe: "Sisa Sayuran", berat: 400, kategori: "organik" },
        ]
    },
    {
        id: 8,
        nama: "Plastik Reborn Krian",
        tanggal: new Date(new Date().setDate(new Date().getDate() - 28)).toISOString(), // 28 hari lalu
        sampah: [
            { tipe: "Ember Plastik Bekas", berat: 90, kategori: "non-organik" },
        ]
    },
];

/**
 * Initialize all default data in localStorage if they don't exist yet
 */
export function initializeLocalStorage() {
    if (!localStorage.getItem('appUsers')) {
        localStorage.setItem('appUsers', JSON.stringify(VALID_CREDENTIALS));
    }
    
    const partnerKey = 'samling_pro_sidoarjo_v1';
    if (!localStorage.getItem(partnerKey)) {
        localStorage.setItem(partnerKey, JSON.stringify(defaultPartners));
    }

    const transactionsKey = 'samling_transactions';
    if (!localStorage.getItem(transactionsKey)) {
        localStorage.setItem(transactionsKey, JSON.stringify(defaultTransactions));
    }
    
    // Default notifications setup if empty
    const notificationsKey = 'samling_notifications';
    if (!localStorage.getItem(notificationsKey)) {
        const initialNotifications = [
            {
                id: Date.now() - 25 * 60 * 1000,
                icon: 'fa-solid fa-truck',
                iconColor: 'text-blue-500',
                title: 'Truk Sampah Sedang Dalam Perjalanan',
                message: 'Truk dengan nomor polisi AG 7788 KK sedang menuju TPS.',
                time: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
                read: false
            },
            {
                id: Date.now() - 4 * 3600 * 1000,
                icon: 'fa-solid fa-check-circle',
                iconColor: 'text-green-500',
                title: 'Pengambilan Sampah Selesai',
                message: 'Pengambilan sampah di komplek Perumtas 4 Regency telah berhasil diselesaikan.',
                time: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
                read: true
            },
            {
                id: Date.now() - 5 * 3600 * 1000,
                icon: 'fa-solid fa-file-invoice',
                iconColor: 'text-yellow-500',
                title: 'Laporan angkut sampah baru di kecamatan Glintung',
                message: 'Terdapat laporan angkut baru, segera kirimkan truk untuk pengambilan sampah.',
                time: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
                read: true
            },
            {
                id: Date.now() - 8 * 3600 * 1000,
                icon: 'fa-solid fa-triangle-exclamation',
                iconColor: 'text-red-500',
                title: 'Jadwal Pengambilan Berubah',
                message: 'Jadwal pengambilan sampah untuk Desa Sudimoro diubah menjadi pukul 10:00.',
                time: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
                read: true
            }
        ];
        localStorage.setItem(notificationsKey, JSON.stringify(initialNotifications));
    }
}
