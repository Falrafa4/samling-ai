import sys
import os
import random
from datetime import datetime, timedelta

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.database.database import SessionLocal
from app.models.zones import Zone
from app.models.sensor_data import SensorData
from app.models.volume_predictions import VolumePrediction
from app.utils.timezone import get_jakarta_now


def seed_sensor_data():
    """
    Seed sensor data simulasi untuk ~10% TPS (sekitar 130 TPS) dengan data 7 hari.
    Distribusi status: ~60% Normal, ~25% Warning, ~15% High Priority
    """
    db = SessionLocal()
    try:
        print("=" * 60)
        print("Memulai proses seeding data sensor & prediksi (simulasi 7 hari)...")
        print("=" * 60)

        # Clear existing sensor data and predictions
        deleted_count = db.query(SensorData).delete()
        deleted_pred_count = db.query(VolumePrediction).delete()
        db.commit()
        print(f"✓ Data sensor lama ({deleted_count} records) dan prediksi lama ({deleted_pred_count} records) berhasil dibersihkan.")

        # Get all zones
        all_zones = db.query(Zone).order_by(Zone.id).all()
        total_zones = len(all_zones)
        print(f"✓ Total TPS tersedia: {total_zones}")

        # Select ~10% zones (130 TPS) - distributed across all wilayah
        target_count = max(10, int(total_zones * 0.10))  # Minimum 10 TPS
        
        # Group zones by wilayah for proportional distribution
        zones_by_wilayah = {}
        for zone in all_zones:
            wilayah = zone.wilayah or "Unknown"
            if wilayah not in zones_by_wilayah:
                zones_by_wilayah[wilayah] = []
            zones_by_wilayah[wilayah].append(zone)
        
        # Select proportionally from each wilayah
        selected_zones = []
        for wilayah, zones in zones_by_wilayah.items():
            count = max(1, int(len(zones) * 0.10))  # At least 1 per wilayah
            selected = random.sample(zones, min(count, len(zones)))
            selected_zones.extend(selected)
        
        # If we're over target, trim randomly; if under, add more
        if len(selected_zones) > target_count:
            selected_zones = random.sample(selected_zones, target_count)
        elif len(selected_zones) < target_count:
            remaining = [z for z in all_zones if z not in selected_zones]
            needed = target_count - len(selected_zones)
            selected_zones.extend(random.sample(remaining, min(needed, len(remaining))))
        
        print(f"✓ TPS terpilih untuk dipasangi sensor: {len(selected_zones)} (~{len(selected_zones)/total_zones*100:.1f}%)")

        # Distribute zones by target status
        random.shuffle(selected_zones)
        normal_count = int(len(selected_zones) * 0.60)
        warning_count = int(len(selected_zones) * 0.25)
        high_priority_count = len(selected_zones) - normal_count - warning_count
        
        zones_normal = selected_zones[:normal_count]
        zones_warning = selected_zones[normal_count:normal_count + warning_count]
        zones_high_priority = selected_zones[normal_count + warning_count:]
        
        print(f"  - Normal: {len(zones_normal)} TPS (~60%)")
        print(f"  - Warning: {len(zones_warning)} TPS (~25%)")
        print(f"  - High Priority: {len(zones_high_priority)} TPS (~15%)")

        # Sensor types
        sensor_types = [
            "Ultrasonic-Organic",
            "Ultrasonic-Anorganic",
            "MQ-135",
            "DHT-22-Temp",
            "DHT-22-Humid"
        ]

        # Time parameters: 7 days, 4 readings per day
        now = get_jakarta_now()
        days = 7
        readings_per_day = 4
        hours_between_readings = 24 // readings_per_day  # 6 hours

        sensor_records = []
        prediction_records = []
        random.seed(42)  # For reproducibility

        # Helper function to generate realistic fill pattern
        def generate_fill_pattern(status_type, days, readings_per_day):
            """Generate realistic fill percentage pattern over 7 days"""
            total_readings = days * readings_per_day
            pattern = []
            
            if status_type == "Normal":
                # Low fill, frequent pickups
                base_fill = random.uniform(10, 25)
                daily_increase = random.uniform(3, 8)
                for i in range(total_readings):
                    fill = base_fill + (i % (readings_per_day * 2)) * (daily_increase / readings_per_day)
                    # Reset after pickup (every ~2 days)
                    if i > 0 and i % (readings_per_day * 2) == 0:
                        base_fill = random.uniform(10, 25)
                        fill = base_fill
                    pattern.append(min(fill, 45.0))
                    
            elif status_type == "Warning":
                # Medium fill, occasional pickups
                base_fill = random.uniform(35, 50)
                daily_increase = random.uniform(5, 10)
                for i in range(total_readings):
                    fill = base_fill + (i % (readings_per_day * 3)) * (daily_increase / readings_per_day)
                    # Reset after pickup (every ~3 days)
                    if i > 0 and i % (readings_per_day * 3) == 0:
                        base_fill = random.uniform(35, 50)
                        fill = base_fill
                    pattern.append(min(fill, 78.0))
                    
            else:  # High Priority
                # High fill, rare pickups
                base_fill = random.uniform(70, 82)
                daily_increase = random.uniform(2, 5)
                for i in range(total_readings):
                    fill = base_fill + (i % (readings_per_day * 5)) * (daily_increase / readings_per_day)
                    # Occasional reset (every ~5 days or less)
                    if i > 0 and i % (readings_per_day * 5) == 0:
                        base_fill = random.uniform(65, 75)
                        fill = base_fill
                    pattern.append(min(fill, 97.0))
            
            return pattern

        # Generate sensor data for each selected zone
        total_zones_processed = 0
        for zone_list, status_type in [(zones_normal, "Normal"), 
                                        (zones_warning, "Warning"), 
                                        (zones_high_priority, "High Priority")]:
            for zone in zone_list:
                # Generate fill pattern for this zone
                fill_pattern = generate_fill_pattern(status_type, days, readings_per_day)
                
                # Generate readings for each day
                for day in range(days):
                    # Buat satu data prediksi historis harian untuk TPS ini pada jam 07:00 pagi
                    prediction_time = (now - timedelta(days=(days - 1 - day))).replace(hour=7, minute=0, second=0, microsecond=0)
                    day_fills = fill_pattern[day * readings_per_day : (day + 1) * readings_per_day]
                    avg_day_fill = sum(day_fills) / len(day_fills) if day_fills else base_fill
                    
                    # Berikan sedikit deviasi (margin of error) tiruan
                    pred_pct = avg_day_fill + random.uniform(-4, 4)
                    pred_pct = max(0.0, min(100.0, pred_pct))
                    
                    status = "Aman"
                    if pred_pct >= 80:
                        status = "Awas"
                    elif pred_pct >= 50:
                        status = "Waspada"
                        
                    prediction_records.append(
                        VolumePrediction(
                            tps_id=zone.id,
                            kecamatan=zone.kecamatan,
                            predicted_volume_percentage=round(pred_pct, 2),
                            prediction_status=status,
                            priority_rank=random.randint(1, 10),
                            forecast_batch_id=f"batch_seed_{prediction_time.strftime('%Y%m%d')}",
                            model_version="1.0.12",
                            created_at=prediction_time
                        )
                    )

                    for reading in range(readings_per_day):
                        timestamp = now - timedelta(
                            days=(days - 1 - day),
                            hours=(24 - (reading + 1) * hours_between_readings)
                        )
                        
                        idx = day * readings_per_day + reading
                        base_fill = fill_pattern[idx]
                        
                        # Generate data for each sensor type
                        for sensor_type in sensor_types:
                            if sensor_type == "Ultrasonic-Organic":
                                fill_pct = base_fill + random.uniform(-2, 2)
                                value = fill_pct
                            elif sensor_type == "Ultrasonic-Anorganic":
                                fill_pct = base_fill * random.uniform(0.8, 1.1)
                                value = fill_pct
                            elif sensor_type == "MQ-135":
                                # Gas/smell sensor: higher when full
                                fill_pct = base_fill
                                value = 50 + (base_fill * 5) + random.uniform(-20, 20)
                            elif sensor_type == "DHT-22-Temp":
                                # Temperature: higher when full (fermentation)
                                fill_pct = base_fill
                                value = 28 + (base_fill * 0.15) + random.uniform(-2, 3)
                            elif sensor_type == "DHT-22-Humid":
                                # Humidity: varies but correlates slightly with fill
                                fill_pct = base_fill
                                value = 60 + (base_fill * 0.2) + random.uniform(-10, 10)
                            
                            # Clamp values
                            fill_pct = max(0.0, min(100.0, fill_pct))
                            value = max(0.0, value)
                            
                            sensor_records.append(
                                SensorData(
                                    zone_id=zone.id,
                                    sensor_type=sensor_type,
                                    fill_percentage=round(fill_pct, 2),
                                    value=round(value, 2),
                                    created_at=timestamp,
                                    updated_at=timestamp
                                )
                            )
                
                # Update zone risk_status based on latest ultrasonic reading
                latest_fill = fill_pattern[-1]
                if latest_fill > 80:
                    zone.risk_status = "High Priority"
                elif latest_fill >= 50:
                    zone.risk_status = "Warning"
                else:
                    zone.risk_status = "Normal"
                
                total_zones_processed += 1
                if total_zones_processed % 20 == 0:
                    print(f"  Memproses: {total_zones_processed}/{len(selected_zones)} TPS...")

        print(f"✓ Selesai memproses {total_zones_processed} TPS")

        # Bulk insert in batches for performance
        batch_size = 5000
        total_inserted = 0
        print(f"Menyimpan {len(sensor_records)} records ke database...")
        
        for i in range(0, len(sensor_records), batch_size):
            batch = sensor_records[i:i + batch_size]
            db.add_all(batch)
            db.commit()
            total_inserted += len(batch)
            print(f"  → {total_inserted}/{len(sensor_records)} sensor records tersimpan...")
            
        print(f"Menyimpan {len(prediction_records)} prediction records ke database...")
        total_pred_inserted = 0
        for i in range(0, len(prediction_records), batch_size):
            batch = prediction_records[i:i + batch_size]
            db.add_all(batch)
            db.commit()
            total_pred_inserted += len(batch)
            print(f"  → {total_pred_inserted}/{len(prediction_records)} prediction records tersimpan...")

        print("=" * 60)
        print(f"✅ Seeding sensor data selesai!")
        print(f"   Total records: {len(sensor_records)}")
        print(f"   Total TPS dengan sensor: {len(selected_zones)}")
        print(f"   Periode data: 7 hari (4 readings/hari)")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"❌ Error saat seeding sensor data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed_sensor_data()
