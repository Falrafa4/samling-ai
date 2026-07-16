from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from collections import OrderedDict
from datetime import datetime
import joblib
import os
import json
from app.utils.response import response_success

router = APIRouter(tags=["model-details"])

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ai", "models", "waste_volume", "forecast_waste_volume_model.pkl")
DETAILS_PATH = os.path.join(os.path.dirname(__file__), "..", "ai", "model_details.json")

model = joblib.load(MODEL_PATH)


@router.get("/model-details")
def get_model_details():

    """
    Mengambil informasi detail model.
    """

    with open(DETAILS_PATH, "r") as f:
        details = model_details = json.load(f)

    response = OrderedDict()

    response["model_informations"] = {
        "model_name": "Samling Waste Volume Prediction Model",
        "model_description": "Forecast fill percentage of each tps everyday.",
        "model_training_date": datetime.fromtimestamp(os.path.getmtime(MODEL_PATH)).strftime("%Y-%m-%d %H:%M:%S"),
        "model_size_mb": round(os.path.getsize(MODEL_PATH) / (1024 * 1024), 2),
        "model_version": "v1.3",
    }

    response.update(details)

    response.update({
        "scheduler_jobs": [
            {
                "name": "daily_pipeline",
                "description": "Daily pipeline",
                "cron": "0 7 * * *",
            },
            {
                "name": "route_recommendation",
                "description": "Route recommendation",
                "cron": "30 7 * * *",
            },
            {
                "name": "weekly_retrain",
                "description": "Weekly retrain",
                "cron": "0 0 * * 1",
            },
            {
                "name": "iot_ground_truth",
                "description": "IoT ground truth",
                "cron": "0 9 * * *",
            },
            {
                "name": "citizen_reports",
                "description": "Citizen reports",
                "cron": "* * * * *",
            },
        ],
    })
    
    return response_success(data=response, message="Data model berhasil diambil.")