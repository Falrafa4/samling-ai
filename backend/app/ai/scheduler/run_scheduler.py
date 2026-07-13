import argparse

from app.ai.scheduler import (
    forececast_scheduler,
    feature_engineer,
    retrain_scheduler,
)

parser = argparse.ArgumentParser()

parser.add_argument(
    "--run-now",
    action="store_true",
    help="Run collect data + forecast immediately"
)

parser.add_argument(
    "--retrain-now",
    action="store_true",
    help="Run retraining immediately"
)

args = parser.parse_args()

if args.run_now:
    run_daily_pipeline()

elif args.retrain_now:
    run_weekly_retrain()

else:
    start_scheduler()