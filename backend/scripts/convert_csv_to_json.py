import csv
import json
import time
import urllib.request
import urllib.parse
import ssl
import os

CSV_PATH = os.path.join(os.path.dirname(__file__), "../data/tps_dki.csv")
JSON_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "../data/tps_dki_enriched.json")

WILAYAH_FALLBACK = {
    "Jakarta Pusat": (-6.1865, 106.8341),
    "Jakarta Utara": (-6.1338, 106.8822),
    "Jakarta Barat": (-6.1674, 106.7583),
    "Jakarta Selatan": (-6.2967, 106.8181),
    "Jakarta Timur": (-6.2474, 106.9007),
    "Kepulauan Seribu": (-5.6529, 106.5736),
}

KEL_FALLBACK = {}


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

    # Normalize kelurahan: lowercase untuk grouping, tapi keep original casing terpopuler
    kel_counter = {}
    kel_to_wilayah = {}
    for r in rows:
        raw_kel = r.get("kelurahan", "").strip()
        if not raw_kel:
            continue
        norm = normalize_kel(raw_kel)
        if norm not in kel_counter:
            kel_counter[norm] = 0
            kel_to_wilayah[norm] = r.get("wilayah", "").strip()
        kel_counter[norm] += 1

    unique_kel = sorted(kel_counter.keys())
    print(f"Unique kelurahan (normalized): {len(unique_kel)}")

    kel_coords = {}
    geocoded_ok = 0
    geocoded_fallback = 0

    for i, kel in enumerate(unique_kel):
        place = f"{kel}, DKI Jakarta, Indonesia"
        print(f"[{i+1}/{len(unique_kel)}] Geocoding: {kel}...", end="")

        coords = geocode_place(place)
        if coords:
            kel_coords[kel] = coords
            geocoded_ok += 1
            print(f" OK {coords}")
        else:
            fallback = KEL_FALLBACK.get(kel) or WILAYAH_FALLBACK.get(kel_to_wilayah.get(kel, ""), (-6.2, 106.8))
            kel_coords[kel] = fallback
            geocoded_fallback += 1
            print(f" FALLBACK ({kel_to_wilayah.get(kel, '?')}: {fallback})")

        time.sleep(1.1)

    print(f"\nGeocode OK: {geocoded_ok}, Fallback: {geocoded_fallback}")

    enriched = []
    for r in rows:
        raw_kel = r.get("kelurahan", "").strip()
        norm = normalize_kel(raw_kel)
        lat, lng = kel_coords.get(norm, (-6.2, 106.8))
        enriched.append({
            "name": r.get("nama_tps", "").strip(),
            "wilayah": r.get("wilayah", "").strip(),
            "kecamatan": r.get("kecamatan", "").strip(),
            "kelurahan": raw_kel,
            "jenis_tps": r.get("jenis_tps", "").strip(),
            "alamat": r.get("alamat", "").strip(),
            "latitude": lat,
            "longitude": lng,
            "risk_status": "Normal",
        })

    with open(JSON_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(enriched, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(enriched)} TPS ke {JSON_OUTPUT_PATH}")


if __name__ == "__main__":
    main()
