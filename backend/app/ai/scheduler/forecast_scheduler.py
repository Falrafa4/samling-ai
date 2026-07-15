import os
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from app.utils.timezone import get_jakarta_now
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.database import SessionLocal

from app.models.historical_waste_data import HistoricalWasteData
from app.models.volume_predictions import VolumePrediction

MODEL_PATH = "app/ai/models/waste_volume/forecast_waste_volume_model.pkl"
ENCODER_PATH = "app/ai/models/waste_volume/encoders.pkl"

MODEL_VERSION = "v1.0"

FEATURE_COLUMNS = [
    "kecamatan",
    "tps_id",
    "tps_type",
    "zone_population",
    "tps_capacity_kg",
    "day_of_week",
    "is_weekend",
    "is_holiday",
    "daily_growth_rate",
    "rainfall_today",
    "event_urgency_score",
    "current_fill_percentage"
]


def load_model():
    return joblib.load(MODEL_PATH)

def load_encoders():
    return joblib.load(ENCODER_PATH)


def fetch_latest_historical_data(db: Session):

    latest = (
        db.query(
            HistoricalWasteData.tps_id,
            func.max(HistoricalWasteData.timestamp_prediction).label("latest")
        )
        .group_by(HistoricalWasteData.tps_id)
        .subquery()
    )

    rows = (
        db.query(HistoricalWasteData)
        .join(
            latest,
            (HistoricalWasteData.tps_id == latest.c.tps_id)
            &
            (HistoricalWasteData.timestamp_prediction == latest.c.latest)
        )
        .all()
    )

    return rows


# Preprocess

def prepare_features(rows, encoders):

    df = pd.DataFrame([
        {
            "kecamatan": r.kecamatan,
            "tps_id": r.tps_id,
            "tps_type": r.tps_type,
            "zone_population": r.zone_population,
            "tps_capacity_kg": r.tps_capacity_kg,
            "day_of_week": r.day_of_week,
            "is_weekend": r.is_weekend,
            "is_holiday": r.is_holiday,
            "daily_growth_rate": r.daily_growth_rate,
            "rainfall_today": r.rainfall_today,
            "event_urgency_score": r.event_urgency_score,
            "current_fill_percentage": r.current_fill_percentage,
        }
        for r in rows
    ])

    for col in ["kecamatan", "tps_type"]:
        print(col, df[col].unique())
        df[col] = encoders[col].transform(df[col])

    return df[FEATURE_COLUMNS]


def predict(model, X):

    prediction = model.predict(X)

    prediction = np.clip(prediction, 0, 100)

    return prediction


def get_prediction_status(value):

    if value >= 85:
        return "CRITICAL"

    elif value >= 60:
        return "WARNING"

    return "NORMAL"

def assign_priority_rank(rows, predictions):

    ranked = sorted(
        zip(rows, predictions),
        key=lambda x: x[1],
        reverse=True
    )

    result = []

    for rank, (row, prediction) in enumerate(ranked, start=1):
        result.append((row, prediction, rank))

    return result


def save_predictions(db: Session, ranked_predictions):

    batch_id = f"batch_{get_jakarta_now():%Y%m%d_%H%M%S}"

    prediction_objects = []

    for row, prediction, rank in ranked_predictions:

        prediction_objects.append(

            VolumePrediction(
                forecast_batch_id=batch_id,
                kecamatan=row.kecamatan,
                tps_id=row.tps_id,
                predicted_volume_percentage=float(prediction),
                priority_rank=rank,
                prediction_status=get_prediction_status(prediction),
                model_version=MODEL_VERSION,
            )

        )

    db.add_all(prediction_objects)

    db.commit()


def forecast_all_tps():

    db = SessionLocal()

    print("Loading model...")

    model = load_model()

    encoders = load_encoders()

    print("Fetching latest historical data...")

    rows = fetch_latest_historical_data(db)

    if len(rows) == 0:
        print("No historical data found.")
        return

    print("Preparing features...")

    X = prepare_features(rows, encoders)

    print("Running inference...")

    predictions = predict(model, X)
    ranked_predictions = assign_priority_rank(rows, predictions)

    print("Saving predictions...")

    save_predictions(db, ranked_predictions)

    print(f"Finished forecasting {len(rows)} TPS.")

    # Route recommendation is handled by the scheduler runner.
    db.close()
    print("Finished forecasting and closed DB.")
