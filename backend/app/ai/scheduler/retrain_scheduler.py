import joblib
import pandas as pd
import math
import os
import json

from sqlalchemy.orm import Session
from app.database.database import SessionLocal

from xgboost import XGBRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, root_mean_squared_error, r2_score

from app.models.historical_waste_data import HistoricalWasteData


MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "models",
    "waste_volume",
    "forecast_waste_volume_model.pkl"
)

ENCODER_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "models",
    "waste_volume",
    "label_encoders.pkl"
)

DETAILS_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "model_details.json"
)


def retrain_model():

    db = SessionLocal()

    print("Loading historical data...")

    df = pd.read_sql(
        db.query(HistoricalWasteData).statement,
        db.bind
    )

    if len(df) < 100:
        print("Not enough data for retraining.")
        return

    df = df.dropna()

    # -------------------------
    # Feature Engineering
    # -------------------------

    encoding_cols = [
        "kecamatan",
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

    # Best params: XGBoost: {'subsample': 0.8, 'n_estimators': 500, 'min_child_weight': 1, 'max_depth': 6, 'learning_rate': 0.05, 'colsample_bytree': 1.0}
    model = XGBRegressor(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        min_child_weight=1,
        colsample_bytree=1.0,
        random_state=42
    )

    model.fit(X, y)

    y_pred = model.predict(X)

    results = pd.DataFrame({
        "MAE": [mean_absolute_error(y, y_pred)],
        "MAPE": [mean_absolute_percentage_error(y, y_pred)],
        "RMSE": [root_mean_squared_error(y, y_pred)],
        "R2": [r2_score(y, y_pred)]
    })

    importance = pd.DataFrame({
        "Feature": feature_cols,
        "Importance": model.feature_importances_
    })

    print("Saving model...")

    joblib.dump(model, MODEL_PATH)
    joblib.dump(encoders, ENCODER_PATH)

    print("Updating model...")

    model_details = {}

    # Hyperparameters
    model_details["hyperparameters"] = {
        k: (None if isinstance(v, float) and math.isnan(v) else v)
        for k, v in model.get_params().items()
    }

    # Performance Metrics
    model_details["performance_metrics"] = {
        "MAE": round(float(results.iloc[0]["MAE"]), 5),
        "MAPE": round(float(results.iloc[0]["MAPE"]), 5),
        "RMSE": round(float(results.iloc[0]["RMSE"]), 5),
        "R2": round(float(results.iloc[0]["R2"]), 5),
    }

    # Feature Importance
    importance_df = pd.DataFrame({
        "Feature": importance["Feature"],
        "Importance": importance["Importance"]
    }).sort_values(
        by="Importance",
        ascending=False
    ).reset_index(drop=True)

    model_details["feature_importance"] = importance_df.to_dict(orient="records")

    with open(DETAILS_PATH, "w") as f:
        json.dump(model_details, f, indent=4, allow_nan=False)

    print("Retraining completed.")