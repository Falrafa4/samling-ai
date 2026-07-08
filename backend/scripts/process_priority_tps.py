import csv
import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "../data")
CSV_INPUT = os.path.join(DATA_DIR, "tps_dki.csv")
JSON_INPUT = os.path.join(DATA_DIR, "tps_dki_enriched.json")
CSV_OUTPUT = os.path.join(DATA_DIR, "tps_priority_dki.csv")
JSON_OUTPUT = os.path.join(DATA_DIR, "tps_priority_dki_enriched.json")

# Normalization rules
def normalize_kecamatan(raw):
    title = raw.strip().title()
    mapping = {
        "Kramatjati": "Kramat Jati",
        "Tamansari": "Taman Sari",
        "Pulau Seribu Selatan": "Kepulauan Seribu Selatan",
        "Pulau Seribu Utara": "Kepulauan Seribu Utara",
        "Pal Merah": "Palmerah",
        "Pulogadung": "Pulo Gadung",
    }
    return mapping.get(title, title)

def normalize_wilayah(raw):
    key = raw.strip().lower()
    key = key.replace("kota adm. ", "").replace("kab. adm. ", "")
    key = key.replace("kota adm ", "").replace("kab adm ", "")
    key = key.replace(".", "").replace(",", "").strip()
    mapping = {
        "jakarta pusat": "Jakarta Pusat",
        "jakarta utara": "Jakarta Utara",
        "jakarta barat": "Jakarta Barat",
        "jakarta selatan": "Jakarta Selatan",
        "jakarta timur": "Jakarta Timur",
        "kepulauan seribu": "Kepulauan Seribu",
        "kep seribu": "Kepulauan Seribu",
    }
    return mapping.get(key, raw.strip())

# Priority ranking
PRIORITY_MAP = {
    "TPS 3R": 1,
    "Tipe 1": 2, "TIPE 1": 2,
    "Tipe 2": 3, "TIPE 2": 3,
    "Tipe 3": 4, "TIPE 3": 4,
    "Tipe 4": 5, "TIPE 4": 5, "Tipe 4 ": 5, "TIPE 4 ": 5
}

def get_priority(jenis):
    if not jenis:
        return 6
    jenis_clean = jenis.strip()
    return PRIORITY_MAP.get(jenis_clean, 6)

def main():
    # Load existing enriched coordinates
    coords_map = {}
    if os.path.exists(JSON_INPUT):
        with open(JSON_INPUT, encoding="utf-8") as f:
            enriched_data = json.load(f)
            for item in enriched_data:
                # Key matching by original name and normalized kelurahan
                key = (item["name"].strip(), item["kelurahan"].strip().title())
                coords_map[key] = (item["latitude"], item["longitude"])
        print(f"Loaded {len(coords_map)} coordinates from enriched JSON.")
    else:
        print("Warning: tps_dki_enriched.json not found! Fallback coordinates will be used.")

    # Read raw CSV rows
    with open(CSV_INPUT, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Read {len(rows)} raw rows from CSV.")

    # Group by normalized kecamatan
    grouped_tps = {}
    for row in rows:
        kec = normalize_kecamatan(row["kecamatan"])
        if kec not in grouped_tps:
            grouped_tps[kec] = []
        grouped_tps[kec].append(row)

    print(f"Grouped into {len(grouped_tps)} unique normalized kecamatans.")

    prioritized_rows = []
    enriched_rows = []

    # Select 3 priority TPS per kecamatan
    for kec, items in sorted(grouped_tps.items()):
        # Sort items: primary sort by priority rank, secondary sort by name
        sorted_items = sorted(
            items,
            key=lambda x: (get_priority(x["jenis_tps"]), x["nama_tps"].strip().lower())
        )
        # Take top 3
        top_3 = sorted_items[:3]

        for item in top_3:
            # Normalize fields
            norm_wilayah = normalize_wilayah(item["wilayah"])
            norm_kec = normalize_kecamatan(item["kecamatan"])
            norm_kel = item["kelurahan"].strip().title()
            tps_name = item["nama_tps"].strip()
            tps_jenis = item["jenis_tps"].strip().title()
            tps_alamat = item["alamat"].strip()

            # Find coords
            coords_key = (tps_name, norm_kel)
            lat, lng = coords_map.get(coords_key, (None, None))
            
            # Fallback coordinates for regions if not found in lookup
            if lat is None or lng is None:
                fallback_coords = {
                    "Jakarta Pusat": (-6.1865, 106.8341),
                    "Jakarta Utara": (-6.1338, 106.8822),
                    "Jakarta Barat": (-6.1674, 106.7583),
                    "Jakarta Selatan": (-6.2967, 106.8181),
                    "Jakarta Timur": (-6.2474, 106.9007),
                    "Kepulauan Seribu": (-5.6529, 106.5736),
                }
                lat, lng = fallback_coords.get(norm_wilayah, (-6.2, 106.8))
                print(f"Fallback coord used for: {tps_name} ({norm_kel}) -> ({lat}, {lng})")

            # Append to prioritized list
            prioritized_rows.append({
                "periode_data": item["periode_data"].strip(),
                "wilayah": norm_wilayah,
                "kecamatan": norm_kec,
                "kelurahan": norm_kel,
                "nama_tps": tps_name,
                "jenis_tps": tps_jenis,
                "alamat": tps_alamat
            })

            enriched_rows.append({
                "name": tps_name,
                "wilayah": norm_wilayah,
                "kecamatan": norm_kec,
                "kelurahan": norm_kel,
                "jenis_tps": tps_jenis,
                "alamat": tps_alamat,
                "latitude": lat,
                "longitude": lng,
                "risk_status": "Normal"
            })

    # Write CSV
    fieldnames = ["periode_data", "wilayah", "kecamatan", "kelurahan", "nama_tps", "jenis_tps", "alamat"]
    with open(CSV_OUTPUT, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(prioritized_rows)

    # Write JSON
    with open(JSON_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(enriched_rows, f, ensure_ascii=False, indent=2)

    print(f"Successfully wrote {len(prioritized_rows)} priority TPS rows to CSV and JSON.")

if __name__ == "__main__":
    main()
