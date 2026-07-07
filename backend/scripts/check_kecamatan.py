import csv
from collections import Counter

with open("data/tps_dki.csv", encoding="utf-8") as f:
    rows = list(csv.DictReader(f))

kec = Counter()
for r in rows:
    kec[r["kecamatan"].strip()] += 1

print("Raw kecamatan in CSV:")
for k, c in sorted(kec.items()):
    print(f"  \"{k}\": {c}")
