from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    GROQ_API_KEY: str
    MODEL_PATH: str = "ml/models/efficientnet_b4_dr.pth"
    HEATMAP_DIR: str = "static/heatmaps"

    class Config:
        env_file = ".env"

settings = Settings()