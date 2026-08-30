from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image
import io
from app.services.model_service import classifier

router = APIRouter()

@router.post("/classify")
async def classify_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    result = classifier.predict(image)
    return result