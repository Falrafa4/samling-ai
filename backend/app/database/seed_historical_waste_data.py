import sys
import os
import csv
from datetime import datetime

# Add the backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(backend_dir)

from app.database.database import SessionLocal
from app.models.historical_waste_data import HistoricalWasteData

def seed_data():
    db = SessionLocal()
    try:
        csv_path = os.path.join(backend_dir, "app", "ai", "data", "test.csv")
        
        # Check if already seeded to prevent duplication
        if db.query(HistoricalWasteData).first():
            print("Clearing existing data...")
            db.query(HistoricalWasteData).delete()
            db.commit()

        print(f"Reading from {csv_path}...")
        
        batch_size = 5000
        batch = []
        count = 0
        
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Convert timestamp_prediction to datetime object
                timestamp_str = row['timestamp_prediction']
                try:
                    timestamp_dt = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                except ValueError:
                    timestamp_dt = None

                data = HistoricalWasteData(
                    kecamatan=row['kecamatan'],
                    tps_id=row['tps_id'],
                    tps_type=row['tps_type'],
                    zone_population=int(row['zone_population']),
                    tps_capacity_kg=int(row['tps_capacity_kg']),
                    day_of_week=int(row['day_of_week']),
                    is_weekend=int(row['is_weekend']),
                    is_holiday=int(row['is_holiday']),
                    daily_growth_rate=float(row['daily_growth_rate']),
                    rainfall_today=float(row['rainfall_today']),
                    event_urgency_score=float(row['event_urgency_score']),
                    current_fill_percentage=float(row['current_fill_percentage']),
                    timestamp_prediction=timestamp_dt
                )
                batch.append(data)
                count += 1
                
                if len(batch) >= batch_size:
                    db.add_all(batch)
                    db.commit()
                    batch = []
                    print(f"Inserted {count} rows...")

        if batch:
            db.add_all(batch)
            db.commit()
            print(f"Inserted remaining rows. Total: {count}")
            
        print("Seeding completed successfully.")
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
