from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.groq_service import generate_recommendation

router = APIRouter()

class RecommendRequest(BaseModel):
    dr_grade: int
    dme_present: bool = False
    risk_stratification: str = "medium"
    language: str = "english"
    patient_context: dict = {}

@router.post("/recommend")
async def recommend(data: RecommendRequest):
    if data.dr_grade not in range(5):
        raise HTTPException(status_code=400, detail="dr_grade must be 0-4")

    text = generate_recommendation(
        dr_grade=data.dr_grade,
        dme_present=data.dme_present,
        risk_stratification=data.risk_stratification,
        language=data.language,
        patient_context=data.patient_context
    )
    return {
        "recommendation": text,
        "language": data.language,
        "dr_grade": data.dr_grade,
        "dme_present": data.dme_present
    }
