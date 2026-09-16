from datetime import datetime, timedelta, timezone
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
    fundus_image_url: Optional[str] = None
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
    fundus_image_url: Optional[str]
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

@router.patch("/patient/{patient_id}/screenings/review")
async def mark_patient_screenings_reviewed(patient_id: int, db: AsyncSession = Depends(get_db)):
    """
    Called when a doctor confirms/submits their review on the Doctor Review
    page. Marks every pending (referral-recommended, not yet reviewed)
    screening for this patient as reviewed, so they drop out of
    /screenings/pending — the doctor's queue no longer shows them.
    """
    result = await db.execute(
        select(Screening).where(
            Screening.patient_id == patient_id,
            Screening.referral_recommended == True,
            Screening.reviewed == False
        )
    )
    screenings = result.scalars().all()
    if not screenings:
        raise HTTPException(status_code=404, detail="No pending screenings found for this patient")

    for screening in screenings:
        screening.reviewed = True

    await db.commit()
    return {"patient_id": patient_id, "reviewed_count": len(screenings)}

@router.get("/screenings/pending")
async def get_pending_screenings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Screening, Patient)
        .join(Patient, Screening.patient_id == Patient.id)
        .where(Screening.referral_recommended == True, Screening.reviewed == False)
        .order_by(Screening.created_at.desc())
    )
    rows = result.all()
    return [
        {
            "screening_id": s.id,
            "patient_id": p.id,
            "patient_name": p.name,
            "patient_age": p.age,
            "phc_id": p.phc_id,
            "dr_grade": s.dr_grade,
            "dr_confidence": s.dr_confidence,
            "dme_present": s.dme_present,
            "risk_stratification": s.risk_stratification,
            "fundus_image_url": s.fundus_image_url,
            "heatmap_url": s.heatmap_url,
            "recommendation_text": s.recommendation_text,
            "referral_recommended": s.referral_recommended,
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
        for s, p in rows
    ]

@router.get("/screenings/reviewed")
async def get_reviewed_screenings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Screening, Patient)
        .join(Patient, Screening.patient_id == Patient.id)
        .where(Screening.reviewed == True)
        .order_by(Screening.created_at.desc())
    )
    rows = result.all()
    return [
        {
            "screening_id": s.id,
            "patient_id": p.id,
            "patient_name": p.name,
            "patient_age": p.age,
            "phc_id": p.phc_id,
            "dr_grade": s.dr_grade,
            "dr_confidence": s.dr_confidence,
            "dme_present": s.dme_present,
            "risk_stratification": s.risk_stratification,
            "fundus_image_url": s.fundus_image_url,
            "heatmap_url": s.heatmap_url,
            "recommendation_text": s.recommendation_text,
            "referral_recommended": s.referral_recommended,
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
    total_patients = await db.execute(select(func.count(Patient.id)))

    active_phcs = await db.execute(
        select(func.count(func.distinct(Patient.phc_id)))
        .join(Screening, Screening.patient_id == Patient.id)
        .where(Patient.phc_id.isnot(None))
    )
    pending_reviews = await db.execute(
        select(func.count(Screening.id))
        .where(Screening.reviewed == False, Screening.referral_recommended == True)
    )
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    reviewed_30d = await db.execute(
        select(func.count(Screening.id))
        .where(Screening.reviewed == True, Screening.created_at >= thirty_days_ago)
    )

    referrals_recommended_count = referrals.scalar()

    return {
        "total_screenings": total.scalar(),
        "referrals_recommended": referrals_recommended_count,
        "dme_cases": dme_cases.scalar(),
        "grade_distribution": {str(g): c for g, c in grade_dist.all()},
        "total_patients": total_patients.scalar(),
        "active_phcs": active_phcs.scalar(),
        "pending_reviews": pending_reviews.scalar(),
        "reviewed_30d": reviewed_30d.scalar(),
        "referable_cases": referrals_recommended_count
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
    return [
        {
            "id": s.id,
            "patient_id": s.patient_id,
            "dr_grade": s.dr_grade,
            "dr_confidence": s.dr_confidence,
            "dme_present": s.dme_present,
            "dme_confidence": s.dme_confidence,
            "quality_score": s.quality_score,
            "fundus_image_url": s.fundus_image_url,
            "heatmap_url": s.heatmap_url,
            "vessel_map_url": s.vessel_map_url,
            "risk_stratification": s.risk_stratification,
            "referral_recommended": s.referral_recommended,
            "reviewed": s.reviewed,
            "recommendation_text": s.recommendation_text,
            "recommendation_language": s.recommendation_language,
            "created_at": s.created_at.isoformat() if s.created_at else None
        }
        for s in screenings
    ]
