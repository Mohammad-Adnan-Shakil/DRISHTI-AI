from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image
import io
from datetime import datetime
from pathlib import Path
from app.services.model_service import classifier

router = APIRouter()

FUNDUS_DIR = Path("static/screenings/fundus")
FUNDUS_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/classify")
async def classify_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    result = classifier.predict(image)

    # Persist the uploaded fundus photo so the frontend can display the
    # real image (screening page, doctor review, patient history) instead
    # of a placeholder.
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    safe_filename = Path(file.filename or "upload.jpg").name
    saved_filename = f"{timestamp}_{safe_filename}"
    saved_path = FUNDUS_DIR / saved_filename
    with open(saved_path, "wb") as f:
        f.write(contents)

    result["fundus_image_url"] = f"/static/screenings/fundus/{saved_filename}"
    return result
