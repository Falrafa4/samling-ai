import random
from datetime import datetime, time

import numpy as np
from sqlalchemy import and_, func

from app.database.database import SessionLocal
from app.models.historical_waste_data import HistoricalWasteData
from app.models.volume_predictions import VolumePrediction
from app.utils.timezone import get_jakarta_now


def _simulate_target_from_features(
    *,
    baseline_pred_6am: float,
    zone_population: int,
    is_weekend: int,
    is_holiday: int,
    rainfall_today: float,
    event_urgency_score: float,
    current_fill_percentage: float,
) -> float:
    """
    Produce 'target_fill_percentage' consistent with backend/app/ai/data/synthetic_data_generator.py.

    Constraints:
    - baseline from prediction at 06:00
    - gaussian noise added
    - target can be above/below prediction (can decrease)
    - gap vs current_fill_percentage not too big (soft clamp)
    """
    density_multiplier = float(zone_population) / 100000.0

    true_growth = (
        float(np.random.uniform(10, 20)) * density_multiplier
        + int(is_weekend) * float(np.random.uniform(5, 10))
        + int(is_holiday) * float(np.random.uniform(10, 15))
        + float(event_urgency_score) * float(np.random.uniform(3, 6))
    )

    if float(rainfall_today) > 20:
        true_growth -= float(np.random.uniform(2, 5))
    elif float(rainfall_today) > 0:
        true_growth += float(np.random.uniform(1, 3))

    # gaussian noise: same spirit as generator (mean 0)
    true_growth = float(true_growth) + float(np.random.normal(0, 4.0))

    # allow target to be below prediction too: add symmetric measurement drift
    measurement_drift = float(np.random.normal(0, 2.5))

    raw_target = float(baseline_pred_6am) + true_growth + measurement_drift

    # keep gap vs current not too big (sensor/ops realism)
    # ponytail: static clamp; make per-TPS/per-type if needed.
    max_gap = 25.0
    lower = float(current_fill_percentage) - max_gap
    upper = float(current_fill_percentage) + max_gap
    clamped = float(np.clip(raw_target, lower, upper))

    # final domain clamp
    return round(float(np.clip(clamped, 0.0, 100.0)), 2)


def simulate_iot_ground_truth():
    db = SessionLocal()
    now = get_jakarta_now()
    today = now.date()

    # baseline: prediction taken at 06:00 today.
    six_am_dt = datetime.combine(today, time(6, 0, 0))

    pred_rows_6am = (
        db.query(VolumePrediction)
        .filter(VolumePrediction.forecast_batch_id == today.strftime("%Y%m%d_%H%M%S"))
        .all()
    )

    if not pred_rows_6am:
        # fallback: latest per tps (previous behavior)
        latest_pred_subq = (
            db.query(
                VolumePrediction.tps_id.label("tps_id"),
                func.max(VolumePrediction.id).label("max_id"),
            )
            .group_by(VolumePrediction.tps_id)
            .subquery()
        )

        pred_rows_6am = (
            db.query(VolumePrediction)
            .join(
                latest_pred_subq,
                and_(
                    VolumePrediction.tps_id == latest_pred_subq.c.tps_id,
                    VolumePrediction.id == latest_pred_subq.c.max_id,
                ),
            )
            .all()
        )

    pred_by_tps = {p.tps_id: float(p.predicted_volume_percentage) for p in pred_rows_6am}

    rows = (
        db.query(HistoricalWasteData)
        .filter(
            func.date(HistoricalWasteData.timestamp_prediction) == today,
            HistoricalWasteData.target_fill_percentage.is_(None),
        )
        .all()
    )

    for r in rows:
        baseline = pred_by_tps.get(r.tps_id)
        if baseline is None:
            continue

        # take features from the 06:00 row (what model knew), but use current row if missing
        zone_population = int(getattr(r, "zone_population", 250000) or 250000)
        is_weekend = int(getattr(r, "is_weekend", 0) or 0)
        is_holiday = int(getattr(r, "is_holiday", 0) or 0)
        rainfall_today = float(getattr(r, "rainfall_today", 0.0) or 0.0)
        event_urgency_score = float(getattr(r, "event_urgency_score", 0.0) or 0.0)
        current_fill_percentage = float(getattr(r, "current_fill_percentage", baseline) or baseline)

        r.target_fill_percentage = _simulate_target_from_features(
            baseline_pred_6am=baseline,
            zone_population=zone_population,
            is_weekend=is_weekend,
            is_holiday=is_holiday,
            rainfall_today=rainfall_today,
            event_urgency_score=event_urgency_score,
            current_fill_percentage=current_fill_percentage,
        )

    db.commit()
