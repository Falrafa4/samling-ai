import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DEPOTS_JSON_PATH = BASE_DIR / "core" / "depots.json"

def load_depots():
    try:
        with open(DEPOTS_JSON_PATH, "r") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading depots.json: {e}")
        return {}

def get_depot_coords(coverage_area: str):
    if not coverage_area:
        return None
    depots = load_depots()
    return depots.get(coverage_area)
