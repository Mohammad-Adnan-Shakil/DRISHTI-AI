from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.models.screening import Screening
from app.models.patient import Patient

router = APIRouter()

class ScreeningCreate(BaseModel):
    patient_id: int
    dr_grade: int
    dr_confidence: Optional[float] = None
    dme_present: bool = False
    dme_confidence: Optional[float] = None
    quality_score: Optional[int] = None
    heatmap_url: Optional[str] = None
    vessel_map_url: Optional[str] = None
    risk_stratification: Optional[str] = None
    referral_recommended: bool = False
    recommendation_text: Optional[str] = None
    recommendation_language: str = "english"

class ScreeningResponse(BaseModel):
    id: int
    patient_id: int
    dr_grade: int
    dr_confidence: Optional[float]
    dme_present: bool
    dme_confidence: Optional[float]
    quality_score: Optional[int]
    heatmap_url: Optional[str]
    vessel_map_url: Optional[str]
    risk_stratification: Optional[str]
    referral_recommended: bool
    recommendation_text: Optional[str]
    recommendation_language: str

    class Config:
        from_attributes = True

@router.post("/screening", response_model=ScreeningResponse)
async def save_screening(data: ScreeningCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).where(Patient.id == data.patient_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Patient not found")
    screening = Screening(**data.model_dump())
    db.add(screening)
    await db.commit()
    await db.refresh(screening)
    return screening

@router.get("/screenings/pending")
async def get_pending_screenings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Screening, Patient)
        .join(Patient, Screening.patient_id == Patient.id)
        .where(Screening.referral_recommended == True)
        .order_by(Screening.created_at.desc())
    )
    rows = result.all()
    return [
        {
            "screening_id": s.id,
            "patient_id": p.id,
            "patient_name": p.name,
            "patient_age": p.age,
            "dr_grade": s.dr_grade,
            "dme_present": s.dme_present,
            "risk_stratification": s.risk_stratification,
            "heatmap_url": s.heatmap_url,
            "recommendation_text": s.recommendation_text,
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
        for s, p in rows
    ]

@router.get("/screenings/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    total = await db.execute(select(func.count(Screening.id)))
    referrals = await db.execute(
        select(func.count(Screening.id)).where(Screening.referral_recommended == True)
    )
    dme_cases = await db.execute(
        select(func.count(Screening.id)).where(Screening.dme_present == True)
    )
    grade_dist = await db.execute(
        select(Screening.dr_grade, func.count(Screening.id))
        .group_by(Screening.dr_grade)
    )
    return {
        "total_screenings": total.scalar(),
        "referrals_recommended": referrals.scalar(),
        "dme_cases": dme_cases.scalar(),
        "grade_distribution": {str(g): c for g, c in grade_dist.all()}
    }

@router.get("/screening/{screening_id}", response_model=ScreeningResponse)
async def get_screening(screening_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Screening).where(Screening.id == screening_id))
    screening = result.scalar_one_or_none()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")
    return screening

@router.get("/patient/{patient_id}/history")
async def get_history(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Screening)
        .where(Screening.patient_id == patient_id)
        .order_by(Screening.created_at.desc())
    )
    screenings = result.scalars().all()
    return screenings
