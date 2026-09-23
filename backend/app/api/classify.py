from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image
import io
from datetime import datetime
from pathlib import Path
from app.services.model_service import classifier
from app.services.vessel_service import extract_vessels
from fastapi import Depends
from app.api.auth import verify_token, TokenData

router = APIRouter()

FUNDUS_DIR = Path("static/screenings/fundus")
FUNDUS_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/classify")
async def classify_image(file: UploadFile = File(...), token: TokenData = Depends(verify_token)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    result = classifier.predict(image)

    # Save fundus image
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    safe_filename = Path(file.filename or "upload.jpg").name
    saved_filename = f"{timestamp}_{safe_filename}"
    saved_path = FUNDUS_DIR / saved_filename
    with open(saved_path, "wb") as f:
        f.write(contents)

    result["fundus_image_url"] = f"/static/screenings/fundus/{saved_filename}"

    # Run vessel segmentation
    try:
        vessel_result = extract_vessels(str(saved_path))
        result["vessel_map_url"] = vessel_result["vessel_map_url"]
        result["vessel_mask_url"] = vessel_result["vessel_mask_url"]
        result["vessel_density"] = vessel_result["vessel_density"]
    except Exception as e:
        result["vessel_map_url"] = None
        result["vessel_mask_url"] = None
        result["vessel_density"] = None

    return result