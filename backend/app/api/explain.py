from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
import shutil, uuid
from pathlib import Path
from typing import Optional
from app.services.gradcam_service import generate_gradcam
from fastapi import Depends
from app.api.auth import verify_token, TokenData

router = APIRouter()

UPLOAD_DIR = Path("static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/explain")
async def explain(file: UploadFile = File(...), grade: Optional[int] = Form(None)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    temp_path = str(UPLOAD_DIR / f"{uuid.uuid4().hex}_{file.filename}")
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    result = generate_gradcam(temp_path, target_grade=grade)
    return result
