from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api import classify, explain, recommend, patient, screening, referral, quality, auth
from app.core.database import engine
from app.core.config import settings
from app.services.model_service import classifier
from app.core.logging_config import logger
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from datetime import datetime, timedelta, timezone

STATIC_DIR = Path(__file__).resolve().parent / "static"
Path(STATIC_DIR / "screenings/fundus").mkdir(parents=True, exist_ok=True)
Path(STATIC_DIR / "screenings/gradcam").mkdir(parents=True, exist_ok=True)


def cleanup_staging_files(max_age_hours: int = 24):
    cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
    for directory in (STATIC_DIR / "temp", STATIC_DIR / "uploads"):
        directory.mkdir(parents=True, exist_ok=True)
        for path in directory.iterdir():
            if path.is_file() and datetime.fromtimestamp(
                path.stat().st_mtime, timezone.utc
            ) < cutoff:
                path.unlink()


cleanup_staging_files()


class NgrokBypassMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["ngrok-skip-browser-warning"] = "true"
        return response


app = FastAPI(title="DRISHTI-AI", version="1.0.0")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(NgrokBypassMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(quality.router, prefix="/api")
app.include_router(classify.router, prefix="/api")
app.include_router(explain.router, prefix="/api")
app.include_router(recommend.router, prefix="/api")
app.include_router(patient.router, prefix="/api")
app.include_router(screening.router, prefix="/api")
app.include_router(referral.router, prefix="/api")


@app.on_event("startup")
async def startup():
    logger.info("DRISHTI-AI backend starting up")


@app.get("/health")
async def health():
    logger.info("Health check requested")
    database = {"available": True, "error": None}
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
    except Exception as exc:
        database = {"available": False, "error": type(exc).__name__}
        logger.error(f"Database health check failed: {exc}")

    model = classifier.status()
    if not model["available"]:
        model["error"] = model["error"] or "ONNX model files are missing"
        logger.warning("Model not loaded")
    status = "ok" if database["available"] and model["loaded"] else "degraded"
    logger.info(f"Health check result: {status}")
    return {"status": status, "database": database, "model": model}