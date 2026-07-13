import joblib
import pandas as pd

from sqlalchemy.orm import Session

from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder

from app.models.historical_waste_data import HistoricalWasteData


MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "ai",
    "models",
    "forecast_waste_volume_model.pkl"
)

ENCODER_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "ai",
    "models",
    "label_encoders.pkl"
)


def retrain_model(db: Session):

    print("Loading historical data...")

    df = pd.read_sql(
        db.query(HistoricalWasteData).statement,
        db.bind
    )

    if len(df) < 100:
        print("Not enough data for retraining.")
        return

    # -------------------------
    # Feature Engineering
    # -------------------------

    encoding_cols = [
        "kecamatan",
        "tps_id",
        "tps_type"
    ]

    encoders = {}

    for col in encoding_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        encoders[col] = le

    feature_cols = [
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

    X = df[feature_cols]
    y = df["target_fill_percentage"]

    print("Training model...")

    # Best params: {'learning_rate': 0.05, 'max_depth': 5, 'n_estimators': 200, 'subsample': 0.8}
    model = GradientBoostingRegressor(
        learning_rate=0.05,
        max_depth=5,
        n_estimators=200,
        subsample=0.8,
        random_state=42,
    )

    model.fit(X, y)

    print("Saving model...")

    joblib.dump(model, MODEL_PATH)
    joblib.dump(encoders, ENCODER_PATH)

    print("Retraining completed.")