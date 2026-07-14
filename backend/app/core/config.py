from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str
    DEBUG: bool
    SECRET_KEY: str
    DATABASE_URL: str
    MODEL_PATH: str
    UPLOAD_FOLDER: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # Default 24 jam (1440 menit)
    ALGORITHM: str = "HS256"

    # Scheduler configurations (standard crontab expressions)
    SCHEDULER_DAILY_PIPELINE_CRON: str = "0 7 * * *"
    SCHEDULER_ROUTE_RECOMMENDATION_CRON: str = "30 7 * * *"
    SCHEDULER_WEEKLY_RETRAIN_CRON: str = "0 0 * * 1"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()