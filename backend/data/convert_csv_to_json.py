import pandas as pd
import json
import hashlib
import os

csv_path = "/home/naufal/Documents/my-projects/samling-ai/backend/data/tps_dki_filtered.csv"
json_path = "/home/naufal/Documents/my-projects/samling-ai/backend/data/tps_dki_filtered_enriched.json"

# Koordinat pusat wilayah administrasi DKI Jakarta untuk peletakan geografis yang realistis
WILAYAH_COORDS = {
    "Jakarta Utara": (-6.13, 106.90),
    "Jakarta Pusat": (-6.18, 106.83),
    "Jakarta Selatan": (-6.27, 106.81),
    "Jakarta Timur": (-6.25, 106.89),
    "Jakarta Barat": (-6.16, 106.75),
    "Pulau Seribu": (-5.90, 106.55),
    "Kepulauan Seribu": (-5.90, 106.55)
}

# Koordinat default jika wilayah tidak terpetakan (Monas, Jakarta Pusat)
DEFAULT_LAT = -6.1754
DEFAULT_LNG = 106.8272

def get_deterministic_offset(text1, text2):
    """
    Menghasilkan offset koordinat deterministik berbasis hash MD5
    agar data TPS tersebar secara konsisten (tidak saling tumpih tindih) setiap kali skrip dijalankan.
    """
    combined = f"{text1}-{text2}".encode('utf-8')
    h = hashlib.md5(combined).hexdigest()
    # Konversi hash hex ke nilai float kecil berkisar antara -0.035 s.d 0.035
    offset_lat = (int(h[:8], 16) / 0xffffffff - 0.5) * 0.07
    offset_lng = (int(h[8:16], 16) / 0xffffffff - 0.5) * 0.07
    return offset_lat, offset_lng

def convert_csv_to_json():
    if not os.path.exists(csv_path):
        print(f"Error: File {csv_path} tidak ditemukan.")
        return

    # Baca filtered CSV
    df = pd.read_csv(csv_path)
    
    json_data = []
    
    for _, row in df.iterrows():
        wilayah = str(row['wilayah']).strip()
        kecamatan = str(row['kecamatan']).strip()
        kelurahan = str(row['kelurahan']).strip()
        nama_tps = str(row['nama_tps']).strip()
        jenis_tps = str(row['jenis_tps']).strip()
        alamat = str(row['alamat']).strip() if pd.notna(row['alamat']) else "-"

        # Normalisasi penamaan jenis TPS (contoh: TPS 3R -> Tps 3R)
        jenis_tps_normalized = jenis_tps.replace("TPS", "Tps")

        # Tentukan basis koordinat wilayah administrasi
        base_lat, base_lng = DEFAULT_LAT, DEFAULT_LNG
        for key, coords in WILAYAH_COORDS.items():
            if key.lower() in wilayah.lower():
                base_lat, base_lng = coords
                break
        
        # Tambahkan offset berbasis nama kelurahan & TPS agar koordinat tidak bertumpuk di satu titik pusat
        offset_lat, offset_lng = get_deterministic_offset(kelurahan, nama_tps)
        latitude = round(base_lat + offset_lat, 7)
        longitude = round(base_lng + offset_lng, 7)

        # Susun struktur objek JSON
        tps_obj = {
            "name": nama_tps,
            "wilayah": wilayah,
            "kecamatan": kecamatan,
            "kelurahan": kelurahan,
            "jenis_tps": jenis_tps_normalized,
            "alamat": alamat,
            "latitude": latitude,
            "longitude": longitude,
            "risk_status": "Normal" # Status awal default
        }
        
        json_data.append(tps_obj)

    # Simpan ke file JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)
        
    print(f"Berhasil mengonversi {len(json_data)} baris CSV ke JSON.")
    print(f"Hasil disimpan di: {json_path}")

if __name__ == "__main__":
    convert_csv_to_json()
