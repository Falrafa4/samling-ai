import joblib
import pandas as pd
import json
import math

model = joblib.load("models/waste_volume/forecast_waste_volume_model.pkl")

importance = pd.read_csv("data/feature_importance.csv")
results = pd.read_csv("data/model_results.csv")
data = pd.read_csv("data/synthetic_data.csv")

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
    "Best CV Score": round(float(results.iloc[0]["Best CV Score"]), 5),
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

# Training Dataset Summary
model_details["dataset_records"] = len(data)
model_details["dataset_TPS"] = len(data["tps_id"].unique())
model_details["dataset_coverage"] = data["kecamatan"].unique().tolist()
model_details["time_range"] = f"{data['timestamp_prediction'].min()} - {data['timestamp_prediction'].max()}"
model_details["dataset_features"] = list(data.drop(columns=["target_fill_percentage"]).columns)
model_details["dataset_label"] = data["target_fill_percentage"].name

# Model Runtime
model_details["training_time"] = "14m 37s"
model_details["inference_time"] = "0.05s / TPS"
model_details["forecast_time"] = "3.2s"

print(model_details)

with open("model_details.json", "w") as f:
    json.dump(model_details, f, indent=4)