import csv
import json
import time
import urllib.request
import urllib.parse
import ssl
import os
import difflib
import re

CSV_PATH = os.path.join(os.path.dirname(__file__), "../data/tps_dki.csv")
JSON_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "../data/tps_dki_enriched.json")
SILIKA_PATH = os.path.join(os.path.dirname(__file__), "../data/tps_silika_full.json")

WILAYAH_FALLBACK = {
    "Jakarta Pusat": (-6.1865, 106.8341),
    "Jakarta Utara": (-6.1338, 106.8822),
    "Jakarta Barat": (-6.1674, 106.7583),
    "Jakarta Selatan": (-6.2967, 106.8181),
    "Jakarta Timur": (-6.2474, 106.9007),
    "Kepulauan Seribu": (-5.6529, 106.5736),
}

KEL_FALLBACK = {}

# Load silika data if available
silika_data = []
if os.path.exists(SILIKA_PATH):
    with open(SILIKA_PATH, "r", encoding="utf-8") as sf:
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

def normalize_kel(name):
    return name.strip().title()

def geocode_place(place_name):
    url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(place_name)}&format=json&limit=1"
    req = urllib.request.Request(url, headers={
        "User-Agent": "SamlingAI/1.0 (backend-data-enrichment)"
    })
    try:
        with urllib.request.urlopen(req, context=ssl._create_unverified_context(), timeout=15) as resp:
            data = json.loads(resp.read().decode())
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception as e:
        print(f"    Error: {e}")
    return None

def main():
    with open(CSV_PATH, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    print(f"Total TPS dari CSV: {len(rows)}")

    kel_coords = {}
    geocoded_ok = 0
    geocoded_fallback = 0
    matched_count = 0
    enriched = []

    for idx, r in enumerate(rows):
        raw_kel = r.get("kelurahan", "").strip()
        norm_kel = normalize_kel(raw_kel)
        nama_tps = r.get("nama_tps", "").strip()
        kecamatan = r.get("kecamatan", "").strip()
        wilayah = r.get("wilayah", "").strip()
        jenis_tps = r.get("jenis_tps", "").strip()

        # Try silika first
        lat, lng, matched_jenis, score = get_real_coords(nama_tps, raw_kel, kecamatan, wilayah)
        if lat is not None and lng is not None:
            latitude, longitude = lat, lng
            jenis_tps = matched_jenis
            matched_count += 1
        else:
            if norm_kel not in kel_coords:
                place = f"{norm_kel}, DKI Jakarta, Indonesia"
                print(f"[{len(kel_coords)+1}] Geocoding fallback: {norm_kel}...", end="")
                coords = geocode_place(place)
                if coords:
                    kel_coords[norm_kel] = coords
                    geocoded_ok += 1
                    print(f" OK {coords}")
                else:
                    fallback = KEL_FALLBACK.get(norm_kel)
                    if not fallback:
                        fallback = WILAYAH_FALLBACK.get(wilayah, (-6.2, 106.8))
                        for key, c in WILAYAH_FALLBACK.items():
                            if key.lower() in wilayah.lower():
                                fallback = c
                                break
                    kel_coords[norm_kel] = fallback
                    geocoded_fallback += 1
                    print(f" FALLBACK ({wilayah}: {fallback})")
                time.sleep(1.1)
            
            latitude, longitude = kel_coords[norm_kel]

        enriched.append({
            "name": nama_tps,
            "wilayah": wilayah,
            "kecamatan": kecamatan,
            "kelurahan": raw_kel,
            "jenis_tps": jenis_tps.strip().title(),
            "alamat": r.get("alamat", "").strip(),
            "latitude": latitude,
            "longitude": longitude,
            "risk_status": "Normal",
        })

    print(f"\nGeocode OK: {geocoded_ok}, Fallback: {geocoded_fallback}, Real match: {matched_count}/{len(rows)}")

    with open(JSON_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(enriched, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(enriched)} TPS ke {JSON_OUTPUT_PATH}")

if __name__ == "__main__":
    main()
