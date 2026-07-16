# Samling AI (Backend) -Development Guide
This directory contains the AI automation (data generation/feature engineering), forecasting, and route recommendation scheduler used by the Samling backend.

> Timezone: all scheduler jobs run in `Asia/Jakarta`.

---

## 1) Folder structure (relevant)
```
backend/app/ai/
├─ README.md
├─ data/
│  ├─ zone_population.py          # Static mapping: kecamatan -> population (fallback default)
│  └─ tps_capacity.py             # Static mapping: tps_id -> capacity_kg (fallback default)
├─ models/
│  └─ waste_volume/
│     ├─ forecast_waste_volume_model.pkl  # Trained ML model (joblib)
│     ├─ encoders.pkl                    # Categorical encoders for inference
│     └─ Waste Volume Predictions.ipynb   # Training / exploration notebook
└─ scheduler/
   ├─ scheduler.py                 # APScheduler wiring + cron jobs
   ├─ run_scheduler.py             # Optional manual runner (dev)
   ├─ feature_engineer.py          # Daily feature generation -> HistoricalWasteData
   ├─ forecast_scheduler.py        # Forecast runner (writes VolumePrediction)
   ├─ route_scheduler.py           # VRP-like route generation (writes RouteRecommendation)
   ├─ retrain_scheduler.py         # Weekly retrain hook
   ├─ citizen_report_scheduler.py  # Citizen report processing hook
   └─ iot_ground_truth_scheduler.py# IoT ground-truth simulation hook
```

---

## 2) Pipeline flow & scheduler

### 2.1 Where the scheduler is started
Scheduler starts automatically when FastAPI starts:

- `backend/app/main.py`
  - `lifespan()` calls `start_scheduler(blocking=False)`
  - on shutdown: `scheduler.shutdown()`

### 2.2 Job definitions
Defined in `backend/app/ai/scheduler/scheduler.py` using APScheduler + `CronTrigger.from_crontab(...)`.

Configured via env in `backend/app/core/config.py`:
- `SCHEDULER_DAILY_PIPELINE_CRON` (default: `0 7 * * *`)
- `SCHEDULER_ROUTE_RECOMMENDATION_CRON` (default: `30 7 * * *`)
- `SCHEDULER_WEEKLY_RETRAIN_CRON` (default: `0 0 * * 1`)

Additional optional cron envs are supported (with defaults if missing) in `scheduler.py`:
- `SCHEDULER_IOT_GROUND_TRUTH_CRON` (default: `0 9 * * *`)
- `SCHEDULER_CITIZEN_REPORTS_CRON` (default: `* * * * *`)

### 2.3 Pipeline stages (what runs)
**Daily pipeline** (`run_daily_pipeline`):
1. `collect_daily_data()`  
   Writes *feature rows* into DB table/model `HistoricalWasteData`.
2. `forecast_all_tps()`  
   Generates predictions and stores them (see Volume Prediction section).

**Route recommendation job** (`run_route_recommendation`):
- Opens DB session, calls `generate_routes(db)`.
- Intended to run after forecast batches exist.

**Weekly retrain** (`run_weekly_retrain`):
- Calls `retrain_model()`.

**IoT ground truth simulation** (`run_iot_ground_truth`):
- Calls `simulate_iot_ground_truth()`.

**Citizen reports processing**:
- Runs frequently, calls `process_citizen_reports()`.

### 2.4 Manual trigger (API)
For development/testing, there is a manual background trigger:
- `POST /api/v1/route-recommendations/trigger` (admin-only)
  - runs: `collect_daily_data()` → `forecast_all_tps()` → `generate_routes()`

> Note: the manual `run_full_pipeline()` in `route_recommendations.py` currently calls `generate_routes()` without passing a DB session, while the scheduler path uses `generate_routes(db)`. Keep signatures aligned.

---

## 3) Data used by the pipeline

### 3.1 Core DB entities touched by AI flow
The AI flow reads/writes these main entities:
- `Zone` (TPS metadata; includes `kecamatan`, lat/lon, TPS type)
- `HistoricalWasteData` (daily engineered features per TPS)
- `VolumePrediction` (forecast outputs per TPS, per run/batch)
- `RouteRecommendation` (route plans per batch + coverage area)
- `User` (drivers) / driver availability status

### 3.2 External / derived data sources
Used during feature generation (`feature_engineer.py`):
- **Rainfall**: Open-Meteo API  
  `https://api.open-meteo.com/v1/forecast?...&daily=precipitation_sum...`
  - cached per `kecamatan` for the duration of a single run (`_rainfall_cache`)
  - fallback: random rainfall if API errors

- **Population per kecamatan**: `app/ai/data/zone_population.py` (`ZONE_POPULATION`)
  - fallback default: `30000`

- **TPS capacity per tps_id**: `app/ai/data/tps_capacity.py` (`TPS_CAPACITY`)
  - fallback default: `5000`

### 3.3 Forecast batch identity
`forecast_batch_id` is generated when saving a prediction:
- pattern: `batch_YYYYMMDD_HHMMSS` (Jakarta time)
- stored on `VolumePrediction` and used to associate route recommendations.

---

## 4) Data columns: interpretation & source

### 4.1 Feature columns (engineered daily)
Defined in `backend/app/ai/scheduler/feature_engineer.py`:

| Column | Type (logical) | Meaning | Source |
|---|---|---|---|
| `kecamatan` | categorical | District name for the TPS | `Zone.kecamatan` |
| `tps_id` | string/int | TPS/Zone identifier | `Zone.id` |
| `tps_type` | categorical | TPS type | `Zone.jenis_tps` |
| `zone_population` | numeric | Population proxy for kecamatan | `ZONE_POPULATION[kecamatan]` (fallback 30000) |
| `tps_capacity_kg` | numeric | Capacity estimate in kg | `TPS_CAPACITY[tps_id]` (fallback 5000) |
| `day_of_week` | int (0-6) | Monday=0 ... Sunday=6 | `get_jakarta_now().weekday()` |
| `is_weekend` | int (0/1) | Weekend flag | `weekday() >= 5` |
| `is_holiday` | int (0/1) | Holiday flag | currently fixed `0` |
| `daily_growth_rate` | numeric | Estimated daily fill increase | synthetic formula using rainfall + event score + random |
| `rainfall_today` | numeric | Daily precipitation sum | Open-Meteo (fallback random) |
| `event_urgency_score` | numeric | Event impact on waste | currently `0.0` (`get_event_score()`) |
| `current_fill_percentage` | numeric (0-100) | Estimated current fill | derived from previous `HistoricalWasteData` + growth + noise |
| `timestamp_prediction` | datetime | Feature generation timestamp | `get_jakarta_now()` |

### 4.2 Prediction output columns (API + DB)
From `backend/app/api/volume_predictions.py`:

| Column | Meaning |
|---|---|
| `predicted_volume_percentage` | model output clamped to `[0, 100]` |
| `prediction_status` | `NORMAL` (<70), `WARNING` (>=70), `CRITICAL` (>=90) |
| `forecast_batch_id` | batch identifier for grouping |
| `model_version` | derived from filename (`forecast_waste_volume_model`) |

---

## 5) Endpoints (AI-related)

Base prefix: `/api/v1`

### 5.1 Volume predictions (`tags=["volume-predictions"]`)
Implemented in `backend/app/api/volume_predictions.py`.

- `POST /volume-predictions`  
  Public (intended for internal cron/AI engine). Validates `tps_id` exists in `Zone`, performs inference, stores `VolumePrediction`.

- `GET /volume-predictions`  
  Auth required (via `get_current_user`). Returns all predictions.

- `GET /volume-predictions/{zone_id}/projections`  
  Auth required. Returns last 7 predictions for zone (chronological).

- `GET /volume-predictions/summary`  
  Public. Aggregate summary (some values are placeholders, e.g. confidence).

- `GET /volume-predictions/multi-zone?zone_ids=1,2,3&days=7`  
  Public. Grouped projections per zone.

- `GET /volume-predictions/history?page=1&per_page=20&zone_id=...`  
  Public. Paginated history.

- `GET /volume-predictions/accuracy-trend?days=30`  
  Public. Daily average confidence trend (uses `confidence_score` field if present).

### 5.2 Route recommendations (`tags=["route-recommendations"]`)
Implemented in `backend/app/api/route_recommendations.py`.

- `GET /route-recommendations`  
  Auth required. Optional `status` filter.  
  Note: file currently defines **two** `GET /route-recommendations` handlers; last one wins in FastAPI import order. Consolidate.

- `POST /route-recommendations`  
  Public for AI engine. Validates `route_json` is JSON list; optional driver validation.

- `POST /route-recommendations/trigger`  
  Admin-only. Runs full pipeline in background task.

- `GET /route-recommendations/latest`  
  Public. Returns all routes from most recent `forecast_batch_id`.

- `GET /route-recommendations/driver/{driver_id}`  
  Auth required. Returns driver routes with `Pending` / `In Progress`.

- `POST /route-recommendations/dispatch/{driver_id}`  
  Auth required. Assigns latest pending route and sets statuses.

- `PUT /route-recommendations/{id}/status`  
  Auth required. Updates route status; frees driver when completed.

### 5.3 Model details (`tags=["model-details"]`)
Implemented in `backend/app/api/model_details.py`.

- `GET /model-details`  
  Public. Returns model metadata + a structured payload loaded from `backend/app/ai/model_details.json`:
  - `model_informations`: name, description, training timestamp (from model file mtime), size (MB), version
  - additional sections from JSON (recommended: hyperparameters, metrics, feature_importances, dataset_summary, etc.)

---

## 6) Model details (what exists today)

### 6.1 Runtime inference artifacts
Used by `volume_predictions.py`:
- `backend/app/ai/models/waste_volume/forecast_waste_volume_model.pkl` loaded via `joblib`
- `backend/app/ai/models/waste_volume/encoders.pkl`
  - encodes: `kecamatan`, `tps_type`

### 6.2 Feature set used for inference
Input columns created in `POST /volume-predictions`:
- `kecamatan`
- `tps_id`
- `tps_type`
- `zone_population`
- `tps_capacity_kg`
- `day_of_week`
- `is_weekend`
- `is_holiday`
- `daily_growth_rate`
- `rainfall_today`
- `event_urgency_score`
- `current_fill_percentage`

### 6.3 Hyperparameters / feature importances / metrics
Served via `GET /api/v1/model-details` from a JSON artifact:

- Source file: `backend/app/ai/model_details.json`
- This is the canonical place to store:
  - `hyperparameters`
  - `metrics`
  - `feature_importances`
  - `dataset_summary` (records, TPS count, date range, label/target, feature list)

Notebook remains useful for training/dev:
- `backend/app/ai/models/waste_volume/Waste Volume Predictions.ipynb`

---

## Development notes (pragmatic)
- Scheduler jobs run inside the API process (FastAPI lifespan). For production, consider a dedicated scheduler worker process to avoid coupling API uptime to cron execution.
- `feature_engineer.get_event_score()` and `is_holiday` are placeholders. Add real event/holiday sources when available.
- Open-Meteo calls are per kecamatan per run; if rate limits become an issue, add a persistent cache (Redis) with TTL.