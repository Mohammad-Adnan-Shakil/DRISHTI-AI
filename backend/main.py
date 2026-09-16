from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import classify, explain, recommend, patient, screening, referral, quality
from app.core.config import settings
from fastapi.staticfiles import StaticFiles

# Ensure static storage directories exist before the app starts serving —
# real fundus photos and Grad-CAM heatmaps are written here.
Path("static/screenings/fundus").mkdir(parents=True, exist_ok=True)
Path("static/screenings/gradcam").mkdir(parents=True, exist_ok=True)

app = FastAPI(title="DRISHTI-AI", version="1.0.0")
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(quality.router, prefix="/api")
app.include_router(classify.router, prefix="/api")
app.include_router(explain.router, prefix="/api")
app.include_router(recommend.router, prefix="/api")
app.include_router(patient.router, prefix="/api")
app.include_router(screening.router, prefix="/api")
app.include_router(referral.router, prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok", "model": settings.MODEL_PATH}