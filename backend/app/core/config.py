from pydantic_settings import BaseSettings

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    DATABASE_URL: str
    GROQ_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    MODEL_PATH: str = "models/efficientnet_b4_dr.onnx"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    DATABASE_SSL: bool = True
    JWT_SECRET_KEY: str = "drishti-sih-2026-secret-key-change-in-production"

    @property
    def model_path(self) -> Path:
        path = Path(self.MODEL_PATH)
        return path if path.is_absolute() else PROJECT_ROOT / path

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"

settings = Settings()
