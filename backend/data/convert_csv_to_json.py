import pandas as pd
import json
import hashlib
import os
import difflib
import re

csv_path = "/home/naufal/Documents/my-projects/samling-ai/backend/data/tps_dki_filtered.csv"
json_path = "/home/naufal/Documents/my-projects/samling-ai/backend/data/tps_dki_filtered_enriched.json"
silika_path = "/home/naufal/Documents/my-projects/samling-ai/backend/data/tps_silika_full.json"

# Load silika data if available
silika_data = []
if os.path.exists(silika_path):
    with open(silika_path, "r", encoding="utf-8") as sf:
        silika_data = json.load(sf)

def normalize_text(text):
    if not text:
        return ""
    n = text.lower().strip()
    roman_map = {
        r"\biii\b": "3", r"\bii\b": "2", r"\biv\b": "4", r"\bi\b": "1",
        r"\bv\b": "5", r"\bvi\b": "6", r"\bvii\b": "7", r"\bviii\b": "8",
        r"\bix\b": "9", r"\bx\b": "10"
    }
    for k, v in roman_map.items():
        n = re.sub(k, v, n)
    n = n.replace("kerbo", "kerbau").replace("rw ", "rw").replace("rt ", "rt")
    n = n.replace("jl ", "jalan ").replace("kb ", "kebon ")
    n = re.sub(r"\b(tps|dipo|lps|tpst|pool gerobak|pool|container|bak beton|tpss|bin|kantor)\b", "", n)
    n = re.sub(r"[^a-z0-9]", "", n)
    return n

def get_real_coords(nama_tps, kelurahan, kecamatan, wilayah):
    csv_name_clean = normalize_text(nama_tps)
    csv_kel = kelurahan.lower().strip()
    csv_kec = kecamatan.lower().strip()
    csv_wil = wilayah.lower().strip()
    
    best_match = None
    best_score = 0.0
    
    for st in silika_data:
        st_kel = st.get("kelurahan", "").lower().strip() if st.get("kelurahan") else ""
        st_kec = st.get("kecamatan", "").lower().strip() if st.get("kecamatan") else ""
        st_wil = st.get("wilayah", "").lower().strip() if st.get("wilayah") else ""
        
        # Match regions
        if st_kel == csv_kel or st_kec == csv_kec or (st_wil in csv_wil or csv_wil in st_wil):
            st_name_clean = normalize_text(st.get("name", ""))
            
            if csv_name_clean == st_name_clean and csv_name_clean != "":
                return st["latitude"], st["longitude"], st.get("jenis_tps", "Tipe 4"), 1.0
                
            score = difflib.SequenceMatcher(None, csv_name_clean, st_name_clean).ratio()
            if st_kel == csv_kel and (csv_name_clean in st_name_clean or st_name_clean in csv_name_clean):
                score = max(score, 0.85)
                
            if score > best_score:
                best_score = score
                best_match = st
                
    if best_match and best_score >= 0.7:
        return best_match["latitude"], best_match["longitude"], best_match.get("jenis_tps", "Tipe 4"), best_score
        
    return None, None, None, 0.0

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
    matched_count = 0
    
    for _, row in df.iterrows():
        wilayah = str(row['wilayah']).strip()
        kecamatan = str(row['kecamatan']).strip()
        kelurahan = str(row['kelurahan']).strip()
        nama_tps = str(row['nama_tps']).strip()
        jenis_tps = str(row['jenis_tps']).strip()
        alamat = str(row['alamat']).strip() if pd.notna(row['alamat']) else "-"

        # Normalisasi penamaan jenis TPS (contoh: TPS 3R -> Tps 3R)
        jenis_tps_normalized = jenis_tps.replace("TPS", "Tps")

        # Cari koordinat asli dan kategori asli
        lat, lng, matched_jenis, score = get_real_coords(nama_tps, kelurahan, kecamatan, wilayah)
        if lat is not None and lng is not None:
            latitude, longitude = lat, lng
            jenis_tps_normalized = matched_jenis.strip().title()
            matched_count += 1
        else:
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
        
    print(f"Berhasil mengonversi {len(json_data)} baris CSV ke JSON. Real match: {matched_count}/{len(json_data)}.")
    print(f"Hasil disimpan di: {json_path}")

if __name__ == "__main__":
    convert_csv_to_json()
