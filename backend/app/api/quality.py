from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil, uuid
from pathlib import Path
from app.services.matlab_service import run_quality_check

router = APIRouter()

UPLOAD_DIR = Path("static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/quality-check")
async def quality_check(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    temp_path = str(UPLOAD_DIR / f"{uuid.uuid4().hex}_{file.filename}")
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    result = run_quality_check(temp_path)
    result["original_image_path"] = temp_path
    return result