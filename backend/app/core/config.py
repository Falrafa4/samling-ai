from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str
    DEBUG: bool
    SECRET_KEY: str
    DATABASE_URL: str
    MODEL_PATH: str
    UPLOAD_FOLDER: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()