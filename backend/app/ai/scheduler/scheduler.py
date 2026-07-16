from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.database.database import SessionLocal
from app.core.config import settings

from app.ai.scheduler.feature_engineer import collect_daily_data
from app.ai.scheduler.forecast_scheduler import forecast_all_tps
from app.ai.scheduler.route_scheduler import generate_routes
from app.ai.scheduler.retrain_scheduler import retrain_model
from app.ai.scheduler.citizen_report_scheduler import process_citizen_reports
from app.ai.scheduler.iot_ground_truth_scheduler import simulate_iot_ground_truth


def run_daily_pipeline():
    print("Collecting daily data...")
    collect_daily_data()

    print("Forecasting waste volume...")
    forecast_all_tps()

    print("=== Daily Pipeline Finished ===")


def run_route_recommendation():
    """
    Standalone route recommendation job.
    Can be triggered independently after a forecast has been saved.
    """
    db = SessionLocal()

    try:
        print("=== Route Recommendation Started ===")
        generate_routes(db)
        print("=== Route Recommendation Finished ===")

    finally:
        db.close()


def run_weekly_retrain():
    print("Retraining model...")
    retrain_model()
    print("Retraining finished.")


def run_iot_ground_truth():
    print("=== IoT Ground Truth Simulation Started ===")
    simulate_iot_ground_truth()
    print("=== IoT Ground Truth Simulation Finished ===")


def start_scheduler(blocking: bool = True):
    if blocking:
        scheduler = BlockingScheduler(timezone="Asia/Jakarta")
    else:
        scheduler = BackgroundScheduler(timezone="Asia/Jakarta")

    # Daily Pipeline
    scheduler.add_job(
        run_daily_pipeline,
        trigger=CronTrigger.from_crontab(settings.SCHEDULER_DAILY_PIPELINE_CRON),
        id="daily_pipeline",
        replace_existing=True,
    )

    # Route Recommendation
    scheduler.add_job(
        run_route_recommendation,
        trigger=CronTrigger.from_crontab(settings.SCHEDULER_ROUTE_RECOMMENDATION_CRON),
        id="route_recommendation",
        replace_existing=True,
    )

    # Weekly Retrain
    scheduler.add_job(
        run_weekly_retrain,
        trigger=CronTrigger.from_crontab(settings.SCHEDULER_WEEKLY_RETRAIN_CRON),
        id="weekly_retrain",
        replace_existing=True,
    )

    # IoT Ground Truth Simulation (daily 09:00)
    scheduler.add_job(
        run_iot_ground_truth,
        trigger=CronTrigger.from_crontab(
            getattr(settings, "SCHEDULER_IOT_GROUND_TRUTH_CRON", "0 9 * * *")
        ),
        id="iot_ground_truth_simulation",
        replace_existing=True,
    )

    # Citizen Report Processing (runs frequently)
    scheduler.add_job(
        process_citizen_reports,
        trigger=CronTrigger.from_crontab(
            getattr(settings, "SCHEDULER_CITIZEN_REPORTS_CRON", "* * * * *") # Default to every minute
        ),
        id="citizen_report_processing",
        replace_existing=True,
    )

    print(f"Scheduler started ({'blocking' if blocking else 'background'}). Jobs:")
    print(f"daily_pipeline        — {settings.SCHEDULER_DAILY_PIPELINE_CRON}")
    print(f"route_recommendation  — {settings.SCHEDULER_ROUTE_RECOMMENDATION_CRON}")
    print(f"weekly_retrain        — {settings.SCHEDULER_WEEKLY_RETRAIN_CRON}")
    print(f"iot_ground_truth      — {getattr(settings, 'SCHEDULER_IOT_GROUND_TRUTH_CRON', '0 9 * * *')}")
    print(f"citizen_reports       — {getattr(settings, 'SCHEDULER_CITIZEN_REPORTS_CRON', '* * * * *')}")

    scheduler.start()
    return scheduler