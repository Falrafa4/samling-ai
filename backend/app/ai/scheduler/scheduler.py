from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.schedulers.background import BackgroundScheduler

from app.database.database import SessionLocal

from app.ai.scheduler.feature_engineer import collect_daily_data
from app.ai.scheduler.forecast_scheduler import forecast_all_tps
from app.ai.scheduler.route_scheduler import generate_routes
from app.ai.scheduler.retrain_scheduler import retrain_model


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


def start_scheduler(blocking: bool = True):
    if blocking:
        scheduler = BlockingScheduler()
    else:
        scheduler = BackgroundScheduler()

    # Daily 07:00
    scheduler.add_job(
        run_daily_pipeline,
        trigger="cron",
        hour=7,
        minute=0,
        id="daily_pipeline",
        replace_existing=True,
    )

    # Daily 07.30
    scheduler.add_job(
        run_route_recommendation,
        trigger="cron",
        hour=7,
        minute=30,
        id="route_recommendation",
        replace_existing=True,
    )

    # Monday 00:00
    scheduler.add_job(
        run_weekly_retrain,
        trigger="cron",
        day_of_week="mon",
        hour=0,
        minute=0,
        id="weekly_retrain",
        replace_existing=True,
    )

    print(f"Scheduler started ({'blocking' if blocking else 'background'}). Jobs:")
    print("daily_pipeline        — every day 07:00")
    print("route_recommendation  — every day 07:30")
    print("weekly_retrain        — every Monday 00:00")

    scheduler.start()
    return scheduler