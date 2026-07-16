import argparse

from app.ai.scheduler.feature_engineer import collect_daily_data
from app.ai.scheduler.forecast_scheduler import forecast_all_tps
from app.ai.scheduler.retrain_scheduler import retrain_model
from app.ai.scheduler.route_scheduler import generate_routes
from app.ai.scheduler.scheduler import start_scheduler
from app.ai.scheduler.iot_ground_truth_scheduler import simulate_iot_ground_truth
from app.database.database import SessionLocal

parser = argparse.ArgumentParser()

parser.add_argument(
    "--run-now",
    action="store_true",
    help="Run collect data + forecast immediately + simulate ground truth"
)

parser.add_argument(
    "--retrain-now",
    action="store_true",
    help="Run retraining immediately"
)

args = parser.parse_args()

if args.run_now:
    collect_daily_data()
    forecast_all_tps()
    generate_routes()
    simulate_iot_ground_truth()

elif args.retrain_now:
    retrain_model()
    
else:
    start_scheduler()