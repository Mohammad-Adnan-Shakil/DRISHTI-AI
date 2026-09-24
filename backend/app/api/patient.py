from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from app.core.database import get_db
from app.models.patient import Patient
from app.models.screening import Screening
from app.services.risk_service import calculate_risk

router = APIRouter()

class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    phone: Optional[str] = None
    email: Optional[str] = None
    phc_id: Optional[str] = None
    diabetes_duration_years: Optional[float] = None
    hba1c_level: Optional[float] = None
    hypertension: bool = False
    family_history_dr: bool = False
    preferred_language: str = "english"
    consent: Optional[bool] = True

    diabetes_duration_score: Optional[int] = None
    hba1c_score: Optional[int] = None
    bp_status_score: Optional[int] = None
    renal_marker_score: Optional[int] = None
    insulin_use_score: Optional[int] = None
    prior_dr_history_score: Optional[int] = None
    smoking_status_score: Optional[int] = None
    risk_score_total: Optional[int] = None
    risk_tier: Optional[str] = None

class PatientResponse(BaseModel):
    id: int
    name: str
    age: int
    gender: str
    phone: Optional[str]
    email: Optional[str] = None
    phc_id: Optional[str]
    diabetes_duration_years: Optional[float]
    hba1c_level: Optional[float]
    hypertension: bool
    family_history_dr: bool
    preferred_language: str
    consent: Optional[bool] = True

    diabetes_duration_score: Optional[int] = None
    hba1c_score: Optional[int] = None
    bp_status_score: Optional[int] = None
    renal_marker_score: Optional[int] = None
    insulin_use_score: Optional[int] = None
    prior_dr_history_score: Optional[int] = None
    smoking_status_score: Optional[int] = None
    risk_score_total: Optional[int] = None
    risk_tier: Optional[str] = None

    class Config:
        from_attributes = True

class ScreeningHistoryItem(BaseModel):
    screening_id: int
    date: Optional[str]
    dr_grade: int
    dr_confidence: Optional[float] = None
    fundus_image_url: Optional[str] = None
    heatmap_url: Optional[str] = None
    referral_recommended: bool = False
    reviewed: bool = False

    class Config:
        from_attributes = True

@router.post("/patient", response_model=PatientResponse)
async def create_patient(data: PatientCreate, db: AsyncSession = Depends(get_db)):
    patient = Patient(**data.model_dump())
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient

@router.get("/patient/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.get("/patient/{patient_id}/risk")
async def get_patient_risk(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    screening_result = await db.execute(
        select(Screening)
        .where(Screening.patient_id == patient_id)
        .order_by(Screening.created_at.desc())
    )
    latest = screening_result.scalars().first()
    dr_grade = latest.dr_grade if latest else 0

    patient_dict = {
        "diabetes_duration_years": patient.diabetes_duration_years,
        "hba1c_level": patient.hba1c_level,
        "hypertension": patient.hypertension,
        "family_history_dr": patient.family_history_dr
    }

    risk = calculate_risk(dr_grade, patient_dict)
    risk["patient_id"] = patient_id
    risk["dr_grade"] = dr_grade
    return risk

@router.get("/patient/{patient_id}/history", response_model=List[ScreeningHistoryItem])
async def get_patient_history(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Patient not found")

    screening_result = await db.execute(
        select(Screening)
        .where(Screening.patient_id == patient_id)
        .order_by(Screening.created_at.desc())
    )
    screenings = screening_result.scalars().all()
    return [
        {
            "screening_id": s.id,
            "date": s.created_at.isoformat() if s.created_at else None,
            "dr_grade": s.dr_grade,
            "dr_confidence": s.dr_confidence,
            "fundus_image_url": s.fundus_image_url,
            "heatmap_url": s.heatmap_url,
            "referral_recommended": s.referral_recommended,
            "reviewed": s.reviewed,
        }
        for s in screenings
    ]

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    phc_id: Optional[str] = None
    consent: Optional[bool] = None

@router.patch("/patient/{patient_id}", response_model=PatientResponse)
async def update_patient(patient_id: int, data: PatientUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(patient, key, value)
    await db.commit()
    await db.refresh(patient)
    return patient