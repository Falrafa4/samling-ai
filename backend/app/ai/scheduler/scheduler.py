from apscheduler.schedulers.blocking import BlockingScheduler

from app.database.database import SessionLocal

from app.scheduler.data_pipeline import collect_daily_data
from app.scheduler.forecast_scheduler import forecast_all_tps
from app.scheduler.retrain_scheduler import retrain_model


def run_daily_pipeline():
    db = SessionLocal()

    try:
        print("Collecting daily data...")
        collect_daily_data(db)

        print("Forecasting waste volume...")
        forecast_all_tps(db)

        print("Daily pipeline finished.")

    finally:
        db.close()


def run_weekly_retrain():
    db = SessionLocal()

    try:
        print("Retraining model...")
        retrain_model(db)

        print("Retraining finished.")

    finally:
        db.close()


def start_scheduler():

    scheduler = BlockingScheduler()

    # Daily 06:00
    scheduler.add_job(
        run_daily_pipeline,
        trigger="cron",
        hour=6,
        minute=0,
        id="daily_pipeline",
        replace_existing=True,
    )

    # Weekly Monday 00:00
    scheduler.add_job(
        run_weekly_retrain,
        trigger="cron",
        day_of_week="mon",
        hour=0,
        minute=0,
        id="weekly_retrain",
        replace_existing=True,
    )

    print("Scheduler started...")

    scheduler.start()